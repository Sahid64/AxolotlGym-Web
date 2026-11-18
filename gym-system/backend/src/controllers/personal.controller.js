// ==========================================================================
// PERSONAL del gimnasio: recepcion, instructores y encargados.
// (Los CLIENTES se manejan en clientes.controller.js; no se mezclan aqui.)
// ==========================================================================
import {
  supabase, rpc, consulta, manejar, errorHttp, aMinusculas, aMayusculas, numero, funcionEdge,
} from "../data/supabase.js";

const TEMPORAL = "Axolotl2026"; // contraseña inicial que asigna la base a personal nuevo

// La vista personal_lista_detalle (sql/optimizacion_rendimiento.sql) ya trae teléfono, costo y cupo:
// antes se llamaba detalle_personal una vez por cada persona (N+1).
// Si la vista aún no existe en Supabase, se usa personal_lista + detalle_personal como antes.
let vistaDetalle = true;
const vistaNoExiste = (e) => ["42P01", "PGRST205"].includes(e?.code);

async function leerPersonal(filtrar) {
  if (vistaDetalle) {
    const { data, error } = await filtrar(supabase.from("personal_lista_detalle").select("*"));
    if (!error) return data || [];
    if (!vistaNoExiste(error)) throw errorHttp(500, error.message);
    vistaDetalle = false;
    console.warn("personal_lista_detalle no disponible; se usa detalle_personal por fila:", error.message);
  }
  const filas = await consulta(filtrar(supabase.from("personal_lista").select("*")));
  return Promise.all(
    filas.map(async (p) => {
      const [d] = (await rpc("detalle_personal", { p_id: p.id })) || [];
      return { ...p, telefono: d?.r_telefono, costo: d?.r_costo, max_clientes: d?.r_max_clientes };
    })
  );
}

// Fila de personal_lista_detalle -> empleado como lo usa el frontend
function aEmpleado(p) {
  const empleado = {
    id: p.id,
    nombre: p.nombre,
    correo: p.gmail,
    telefono: p.telefono || "",
    rol: aMinusculas(p.rol),
    estado: aMinusculas(p.estado),
  };
  if (empleado.rol === "instructor") {
    empleado.costoServicio = numero(p.costo);
    empleado.capacidadMaxima = numero(p.max_clientes);
  }
  return empleado;
}

async function buscarEmpleado(id) {
  const [fila] = await leerPersonal((q) => q.eq("id", id).limit(1));
  return fila || null;
}

const opcional = (v) => (v === "" || v == null ? null : Number(v));

// ---- Fecha de nacimiento y datos de salud del personal (solo el Encargado; la base lo valida) ----
const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

async function guardarSalud(actor, usuarioId, salud) {
  const s = salud || {};
  await rpc("guardar_datos_salud_personal", {
    p_actor_gmail: actor,
    p_usuario_id: usuarioId,
    p_fecha_nacimiento: s.fechaNacimiento ? String(s.fechaNacimiento).slice(0, 10) : null,
    p_tipo_sangre: TIPOS_SANGRE.includes(s.tipoSangre) ? s.tipoSangre : null,
    p_alergias: String(s.alergias || "").trim(),
    p_padecimientos: String(s.padecimientos || "").trim(),
    p_medicamentos: String(s.medicamentos || "").trim(),
  });
}

// GET /api/personal/:id/salud
export const obtenerSaludPersonal = manejar(async (req, res) => {
  const filas = await rpc("datos_salud_personal", { p_actor_gmail: req.usuario.correo, p_usuario_id: Number(req.params.id) });
  const d = filas?.[0] || {};
  res.json({
    ok: true,
    salud: {
      fechaNacimiento: d.r_fecha_nacimiento || "",
      tipoSangre: d.r_tipo_sangre || "",
      alergias: d.r_alergias || "",
      padecimientos: d.r_padecimientos || "",
      medicamentos: d.r_medicamentos || "",
    },
  });
});

// PUT /api/personal/:id/foto -> el Encargado toma o actualiza la foto (JPEG en base64), igual que la app
export const guardarFotoPersonal = manejar(async (req, res) => {
  const foto = String(req.body?.foto || "").trim().replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  if (!foto) throw errorHttp(400, "Falta la foto");
  await rpc("guardar_foto_personal", { p_actor_gmail: req.usuario.correo, p_usuario_id: Number(req.params.id), p_foto: foto });
  res.json({ ok: true, mensaje: "Foto actualizada" });
});

// GET /api/personal
export const listarPersonal = manejar(async (req, res) => {
  const filas = await leerPersonal((q) => q.order("nombre"));
  res.json({ ok: true, personal: filas.map(aEmpleado) });
});

// GET /api/personal/fotos?ids=1,2,3 -> { fotos: { id: dataUrl } }  (una petición para toda la tabla)
// Usa fotos_personal (sql/optimizacion_rendimiento.sql); si aún no existe, cae a foto_personal por correo.
export const obtenerFotosPersonal = manejar(async (req, res) => {
  const ids = [...new Set(String(req.query.ids || "").split(",").map(Number))]
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 100);
  if (!ids.length) return res.json({ ok: true, fotos: {} });
  let pares;
  try {
    const filas = (await rpc("fotos_personal", { p_ids: ids })) || [];
    pares = filas.map((f) => [f.r_id, f.r_foto]);
  } catch {
    const emps = await consulta(supabase.from("personal_lista").select("id, gmail").in("id", ids));
    const unicos = [...new Map(emps.map((e) => [e.id, e])).values()];
    pares = await Promise.all(unicos.map(async (e) => [e.id, await rpc("foto_personal", { p_gmail: e.gmail })]));
  }
  const aUrl = (b64) => (String(b64).startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`);
  res.json({ ok: true, fotos: Object.fromEntries(pares.filter(([, b]) => b).map(([id, b]) => [id, aUrl(b)])) });
});

// GET /api/personal/:id/foto -> Foto de perfil del personal (JPEG en base64 desde foto_personal) o null
export const obtenerFotoPersonal = manejar(async (req, res) => {
  const emp = await buscarEmpleado(Number(req.params.id));
  if (!emp?.gmail) return res.json({ ok: true, foto: null });
  const b64 = await rpc("foto_personal", { p_gmail: emp.gmail });
  const foto = b64 ? (String(b64).startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`) : null;
  res.json({ ok: true, foto });
});

// POST /api/personal  (mismo flujo que UsuariosScreen.kt de la app)
// 1. crear_personal crea la cuenta con la contraseña temporal (Axolotl2026).
// 2. La Edge Function "enviar-bienvenida" (la misma que usa la app) le manda al nuevo
//    miembro el correo con su rol, su contraseña temporal y cómo cambiarla en Perfil.
// El Encargado ya no escribe contraseña: si llega "password" en el body se ignora.
// Importante: la contraseña NO se cambia aquí, porque la Edge Function solo envía el
// correo si la cuenta todavía tiene la contraseña inicial.
export const crearPersonal = manejar(async (req, res) => {
  const { nombre, telefono, correo, rol, costoServicio, capacidadMaxima } = req.body;
  if (!nombre || !correo || !rol) {
    return res.status(400).json({ ok: false, mensaje: "nombre, correo y rol son obligatorios" });
  }
  const id = await rpc("crear_personal", {
    p_nombre: nombre,
    p_telefono: telefono || "",
    p_gmail: correo,
    p_rol: aMayusculas(rol),
    p_costo: opcional(costoServicio),
    p_max_clientes: opcional(capacidadMaxima),
  });

  // La persona ya quedó creada: si la salud o el correo fallan solo se avisa (igual que la app)
  const avisos = [];
  if (req.body.salud) {
    try {
      await guardarSalud(req.usuario.correo, id, req.body.salud);
    } catch {
      avisos.push("No se pudieron guardar los datos de salud. Edita a esta persona para intentarlo de nuevo.");
    }
  }

  // funcionEdge nunca lanza: regresa null si el correo salió o el motivo si no
  const motivoCorreo = await funcionEdge("enviar-bienvenida", { gmail: String(correo).trim() });
  if (motivoCorreo) console.error(`enviar-bienvenida (${correo}):`, motivoCorreo);
  const correoEnviado = !motivoCorreo;
  const mensaje = correoEnviado
    ? "Personal registrado. Su rol y su contraseña temporal se enviaron a su correo."
    : `Personal registrado, pero no se pudo enviar el correo de bienvenida. Contraseña temporal: ${TEMPORAL}`;

  const fila = await buscarEmpleado(id);
  res.status(201).json({
    ok: true,
    id,
    empleado: fila ? aEmpleado(fila) : { id },
    correoEnviado,
    motivoCorreo: motivoCorreo || null,
    mensaje,
    avisos,
  });
});

// PUT /api/personal/:id
export const actualizarPersonal = manejar(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await buscarEmpleado(id);
  if (!actual) throw errorHttp(404, "No se encontro a esa persona del personal");

  const { nombre, correo, telefono, rol, estado, costoServicio, capacidadMaxima } = req.body;
  await rpc("editar_personal", {
    p_actor_gmail: req.usuario.correo, // quien hace el cambio (sesion iniciada)
    p_id: id,
    p_nombre: nombre || actual.nombre,
    p_gmail: correo || actual.gmail,
    p_rol: aMayusculas(rol || actual.rol),
    p_estado: aMayusculas(estado || actual.estado),
    p_telefono: telefono ?? null,
    p_costo: opcional(costoServicio),
    p_max_clientes: opcional(capacidadMaxima),
  });
  if (req.body.salud) await guardarSalud(req.usuario.correo, id, req.body.salud);

  res.json({ ok: true, empleado: aEmpleado(await buscarEmpleado(id)) });
});

// DELETE /api/personal/:id
export const eliminarPersonal = manejar(async (req, res) => {
  await rpc("eliminar_personal", { p_actor_gmail: req.usuario.correo, p_id: Number(req.params.id) });
  res.json({ ok: true, mensaje: "Se elimino del personal" });
});
