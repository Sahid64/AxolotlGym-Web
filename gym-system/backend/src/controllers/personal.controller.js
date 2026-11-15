// ==========================================================================
// PERSONAL del gimnasio: recepcion, instructores y encargados.
// (Los CLIENTES se manejan en clientes.controller.js; no se mezclan aqui.)
// ==========================================================================
import {
  supabase, rpc, consulta, manejar, errorHttp, aMinusculas, aMayusculas, numero, funcionEdge,
} from "../data/supabase.js";

const TEMPORAL = "Axolotl2026"; // contraseña inicial que asigna la base a personal nuevo

// Fila de la vista personal_lista -> empleado como lo usa el frontend
async function aEmpleado(p) {
  const [d] = (await rpc("detalle_personal", { p_id: p.id })) || [];
  const empleado = {
    id: p.id,
    nombre: p.nombre,
    correo: p.gmail,
    telefono: d?.r_telefono || "",
    rol: aMinusculas(p.rol),
    estado: aMinusculas(p.estado),
  };
  if (empleado.rol === "instructor") {
    empleado.costoServicio = numero(d?.r_costo);
    empleado.capacidadMaxima = numero(d?.r_max_clientes);
  }
  return empleado;
}

async function buscarEmpleado(id) {
  const [fila] = await consulta(supabase.from("personal_lista").select("*").eq("id", id).limit(1));
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
  const filas = await consulta(supabase.from("personal_lista").select("*").order("nombre"));
  res.json({ ok: true, personal: await Promise.all(filas.map(aEmpleado)) });
});

// GET /api/personal/:id/foto -> Foto de perfil del personal (JPEG en base64 desde foto_personal) o null
export const obtenerFotoPersonal = manejar(async (req, res) => {
  const emp = await buscarEmpleado(Number(req.params.id));
  if (!emp?.gmail) return res.json({ ok: true, foto: null });
  const b64 = await rpc("foto_personal", { p_gmail: emp.gmail });
  const foto = b64 ? (String(b64).startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`) : null;
  res.json({ ok: true, foto });
});

// POST /api/personal
// crear_personal crea la cuenta con la contraseña temporal; si la web manda una
// contraseña, se cambia enseguida (debe cumplir las reglas de seguridad de la base).
export const crearPersonal = manejar(async (req, res) => {
  const { nombre, telefono, correo, password, rol, costoServicio, capacidadMaxima } = req.body;
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

  let mensaje = `Se agrego al personal. Contraseña temporal: ${TEMPORAL}`;
  if (password && password !== TEMPORAL) {
    try {
      const r = await rpc("cambiar_contrasena", { p_gmail: correo, p_actual: TEMPORAL, p_nueva: password });
      mensaje = r === "OK" ? "Se agrego al personal" : `Se agrego al personal con contraseña temporal ${TEMPORAL}. ${r}`;
    } catch (err) {
      mensaje = `Se agrego al personal con contraseña temporal ${TEMPORAL}. ${err.message}`;
    }
  }

  // La persona ya quedó creada: si la salud o el correo fallan solo se avisa (igual que la app)
  const avisos = [];
  if (req.body.salud) {
    try {
      await guardarSalud(req.usuario.correo, id, req.body.salud);
    } catch {
      avisos.push("No se pudieron guardar los datos de salud. Edita a esta persona para intentarlo de nuevo.");
    }
  }
  if (await funcionEdge("enviar-bienvenida", { gmail: correo })) avisos.push("No se pudo enviar el correo de bienvenida.");

  const fila = await buscarEmpleado(id);
  res.status(201).json({ ok: true, id, empleado: fila ? await aEmpleado(fila) : { id }, mensaje, avisos });
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

  res.json({ ok: true, empleado: await aEmpleado(await buscarEmpleado(id)) });
});

// DELETE /api/personal/:id
export const eliminarPersonal = manejar(async (req, res) => {
  await rpc("eliminar_personal", { p_actor_gmail: req.usuario.correo, p_id: Number(req.params.id) });
  res.json({ ok: true, mensaje: "Se elimino del personal" });
});
