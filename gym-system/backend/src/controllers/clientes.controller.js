import { supabase, rpc, consulta, manejar, errorHttp, aMinusculas, funcionEdge } from "../data/supabase.js";
import { enCache } from "../data/cache.js";

// Convierte una fila de la vista clientes_lista a la forma que usa el frontend.
// El nombre completo se separa en nombre (primera palabra) y apellido (resto)
// porque el formulario de la web los pide por separado.
function aCliente(f) {
  const partes = (f.nombre || "").trim().split(/\s+/);
  const desactivado = f.estado !== "ACTIVO";
  const vigente = f.activa && !desactivado;
  return {
    id: f.id,
    nombre: partes[0] || "",
    apellido: partes.slice(1).join(" "),
    nombreCompleto: f.nombre,
    correo: f.gmail,
    telefono: f.telefono,
    numMembresia: f.numero_membresia,
    codigoQr: f.codigo_qr,
    // Si la cuenta fue desactivada o dada de baja, se le retira su plan activo
    plan: desactivado ? "" : aMinusculas(f.plan) || "",
    vence: desactivado ? null : f.fecha_fin,
    fechaRegistro: f.fecha_registro,
    estadoCuenta: aMinusculas(f.estado),
    estado: vigente ? "activo" : "inactivo",
  };
}

const esEliminadoArco = (f) =>
  String(f.gmail || "").endsWith("@anonimo.axolotl") || f.nombre === "Cliente Eliminado";

async function buscarPorId(id) {
  const filas = await consulta(supabase.from("clientes_lista").select("*").eq("id", Number(id)).limit(1));
  if (!filas?.length || esEliminadoArco(filas[0])) throw errorHttp(404, "Cliente no encontrado");
  return filas[0];
}

// Igual que la app: el Encargado ve todos los servicios vigentes (menos la visita, que se cobra
// en "Visitas"); Recepción solo los visibles para Recepción.
const esEncargado = (req) => ["encargado", "dueno"].includes(req.usuario?.rol);
const vistaPlanes = (req) => (esEncargado(req) ? "planes_encargado" : "planes_recepcion");

// Los planes cambian poco: se guardan 60 s en memoria (se invalidan al editar Servicios).
// Antes se consultaban en cada alta y en cada renovación.
const planesDe = (req) =>
  enCache(vistaPlanes(req), 60_000, () =>
    consulta(supabase.from(vistaPlanes(req)).select("id, nombre, precio, duracion_dias, servicio_id").order("precio"))
  );

async function nombrePlan(req, plan) {
  if (!plan) return null;
  const tipos = await planesDe(req);
  const tipo = tipos.find((t) => t.nombre.toLowerCase() === String(plan).toLowerCase());
  if (!tipo) throw errorHttp(400, `Plan no valido: ${plan}`);
  return tipo.nombre;
}

export const listarPlanes = manejar(async (req, res) => {
  const planes = await planesDe(req);
  res.json({ ok: true, planes: planes.map((p) => ({ ...p, precio: Number(p.precio) })) });
});

// ---- Contacto de emergencia y datos de salud (solo Recepción y Encargado; la base lo valida) ----
const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function leerSalud(b) {
  const s = b?.salud || {};
  const tipo = TIPOS_SANGRE.includes(s.tipoSangre) ? s.tipoSangre : null;
  return {
    fechaNacimiento: s.fechaNacimiento ? String(s.fechaNacimiento).slice(0, 10) : null,
    tipoSangre: tipo,
    alergias: String(s.alergias || "").trim(),
    padecimientos: String(s.padecimientos || "").trim(),
    medicamentos: String(s.medicamentos || "").trim(),
  };
}

async function guardarSalud(actor, clienteId, d) {
  await rpc("guardar_datos_salud", {
    p_actor_gmail: actor,
    p_cliente_id: clienteId,
    p_fecha_nacimiento: d.fechaNacimiento,
    p_tipo_sangre: d.tipoSangre,
    p_alergias: d.alergias,
    p_padecimientos: d.padecimientos,
    p_medicamentos: d.medicamentos,
  });
}

// Contacto de emergencia + fecha de nacimiento y datos de salud del cliente (para el formulario de edición)
export const obtenerDetalleCliente = manejar(async (req, res) => {
  const id = Number(req.params.id);
  const params = { p_actor_gmail: req.usuario.correo, p_cliente_id: id };
  const [contacto, salud] = await Promise.all([
    rpc("contacto_emergencia_cliente", params),
    rpc("datos_salud_cliente", params),
  ]);
  const c = contacto?.[0] || {};
  const d = salud?.[0] || {};
  res.json({
    ok: true,
    contacto: { nombre: c.r_nombre || "", telefono: c.r_telefono || "" },
    salud: {
      fechaNacimiento: d.r_fecha_nacimiento || "",
      tipoSangre: d.r_tipo_sangre || "",
      alergias: d.r_alergias || "",
      padecimientos: d.r_padecimientos || "",
      medicamentos: d.r_medicamentos || "",
    },
  });
});

// ---- Cancelación de membresía (igual que la app) ----
// Recepción (o el Encargado) registra la solicitud; la membresía sigue activa hasta que el
// Encargado la autorice en Reportes. La política (reembolso o no) la calcula la base.
const TIPOS_CANCELACION = ["VOLUNTARIA", "ERROR_COBRO"];

const aEvaluacion = (e) => ({
  membresiaId: e.r_membresia_id,
  plan: e.r_plan,
  fechaFin: e.r_fecha_fin,
  fechaPago: e.r_fecha_pago,
  horas: e.r_horas == null ? null : Number(e.r_horas),
  ingreso: Boolean(e.r_ingreso),
  reembolso: Number(e.r_reembolso || 0),
  metodo: e.r_metodo,
  regla: e.r_regla,
  fechaLimite: e.r_fecha_limite,
});

function tipoCancelacion(v) {
  const t = String(v || "VOLUNTARIA").toUpperCase();
  if (!TIPOS_CANCELACION.includes(t)) throw errorHttp(400, "Tipo de cancelación no válido");
  return t;
}

// Vista previa: no cambia nada
export const evaluarCancelacion = manejar(async (req, res) => {
  const filas = await rpc("evaluar_cancelacion", {
    p_actor_gmail: req.usuario.correo,
    p_cliente_id: Number(req.params.id),
    p_tipo: tipoCancelacion(req.query.tipo),
  });
  res.json({ ok: true, evaluacion: filas?.[0] ? aEvaluacion(filas[0]) : null });
});

export const solicitarCancelacion = manejar(async (req, res) => {
  const motivo = String(req.body?.motivo || "").trim();
  if (motivo.length < 3) throw errorHttp(400, "Escribe el motivo de la cancelación");
  const actual = await buscarPorId(req.params.id);
  const filas = await rpc("solicitar_cancelacion", {
    p_actor_gmail: req.usuario.correo,
    p_cliente_id: actual.id,
    p_tipo: tipoCancelacion(req.body?.tipo),
    p_motivo: motivo.slice(0, 300),
  });
  res.json({
    ok: true,
    evaluacion: filas?.[0] ? aEvaluacion(filas[0]) : null,
    mensaje: `Solicitud de cancelación de ${actual.nombre} enviada al encargado.`,
  });
});

// Ids de clientes con una solicitud de cancelación pendiente (para marcarlos en la lista)
export const cancelacionesPendientes = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("solicitudes_cancelacion_pendientes").select("cliente_id"));
  res.json({ ok: true, ids: [...new Set(filas.map((f) => f.cliente_id))] });
});

const nombreCompleto = (b) => `${(b.nombre || "").trim()} ${(b.apellido || "").trim()}`.trim();

const limpiarBase64 = (b64) =>
  String(b64 || "")
    .trim()
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

// Los filtros (búsqueda, estado y perfiles eliminados por ARCO) se aplican en la base,
// no en Node: antes se descargaban todos los clientes en cada búsqueda.
export const listarClientes = manejar(async (req, res) => {
  const { buscar, estado } = req.query;
  let q = supabase
    .from("clientes_lista")
    .select("id, nombre, gmail, telefono, numero_membresia, codigo_qr, plan, fecha_fin, fecha_registro, estado, activa")
    .not("gmail", "like", "%@anonimo.axolotl")
    .neq("nombre", "Cliente Eliminado")
    .order("nombre");

  const filtros = [];
  // Quita caracteres que romperían la sintaxis de los filtros de PostgREST
  const texto = String(buscar || "").replace(/[,()*%\\:"]/g, " ").trim();
  if (texto) filtros.push(`nombre.ilike."*${texto}*",numero_membresia.ilike."*${texto}*",codigo_qr.ilike."${texto}"`);
  if (estado === "inactivo") filtros.push("activa.eq.false,estado.neq.ACTIVO");
  if (estado === "activo") q = q.eq("activa", true).eq("estado", "ACTIVO");
  if (filtros.length === 1) q = q.or(filtros[0]);
  if (filtros.length === 2) q = q.or(`and(or(${filtros[0]}),or(${filtros[1]}))`);

  const filas = await consulta(q);
  res.json({ ok: true, clientes: filas.filter((f) => !esEliminadoArco(f)).map(aCliente) });
});

const aDataUrl = (b64) => (b64 ? (String(b64).startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`) : null);
export const leerIds = (v) =>
  [...new Set(String(v || "").split(",").map(Number))].filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);

// GET /api/clientes/fotos?ids=1,2,3 -> { fotos: { id: dataUrl } }
// Una sola petición para todas las fotos de la tabla (antes: una petición por cliente).
// Usa fotos_clientes (sql/optimizacion_rendimiento.sql); si aún no existe, cae a foto_cliente_por_id.
export const obtenerFotosClientes = manejar(async (req, res) => {
  const ids = leerIds(req.query.ids);
  if (!ids.length) return res.json({ ok: true, fotos: {} });
  let pares;
  try {
    const filas = (await rpc("fotos_clientes", { p_ids: ids })) || [];
    pares = filas.map((f) => [f.r_id, f.r_foto]);
  } catch {
    pares = await Promise.all(ids.map(async (id) => [id, await rpc("foto_cliente_por_id", { p_cliente_id: id })]));
  }
  const fotos = Object.fromEntries(pares.filter(([, b64]) => b64).map(([id, b64]) => [id, aDataUrl(b64)]));
  res.set("Cache-Control", "private, max-age=600"); // la foto del cliente no cambia (trigger bloquear_cambio_foto)
  res.json({ ok: true, fotos });
});

export const obtenerCliente = manejar(async (req, res) => {
  res.json({ ok: true, cliente: aCliente(await buscarPorId(req.params.id)) });
});

// Foto de perfil del cliente (JPEG en base64 desde foto_cliente_por_id) o null
export const obtenerFotoCliente = manejar(async (req, res) => {
  const b64 = await rpc("foto_cliente_por_id", { p_cliente_id: Number(req.params.id) });
  const foto = b64 ? (String(b64).startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`) : null;
  res.json({ ok: true, foto });
});

// Crea usuario + cliente + membresia (con su pago) usando crear_cliente.
// La contraseña inicial la pone la base: Axolotl2026 (el cliente la cambia en la app).
export const crearCliente = manejar(async (req, res) => {
  const { correo, telefono, plan, metodo, contactoNombre, contactoTelefono } = req.body;
  const nombre = nombreCompleto(req.body);
  if (!nombre || !correo) {
    return res.status(400).json({ ok: false, mensaje: "nombre y correo son obligatorios" });
  }
  const filas = await rpc("crear_cliente", {
    p_nombre: nombre,
    p_telefono: telefono || "",
    p_gmail: correo,
    p_plan: await nombrePlan(req, plan),
    p_registrado_por: req.usuario.correo,
    p_contacto_nombre: String(contactoNombre || "").trim(),
    p_contacto_telefono: String(contactoTelefono || ""),
    p_metodo: metodo || "Efectivo",
  });
  const nuevoId = filas[0].r_id;

  // El cliente ya quedó creado: si los datos de salud o el correo fallan solo se avisa (igual que la app).
  // Salud, correo y la lectura del cliente son independientes: van en paralelo (antes en serie).
  const [saludOk, fallaCorreo, fila] = await Promise.all([
    guardarSalud(req.usuario.correo, nuevoId, leerSalud(req.body)).then(() => true, () => false),
    funcionEdge("enviar-bienvenida", { gmail: correo }),
    buscarPorId(nuevoId),
  ]);
  const avisos = [];
  if (!saludOk) avisos.push("No se pudieron guardar los datos de salud. Edita al cliente para intentarlo de nuevo.");
  if (fallaCorreo) avisos.push("No se pudo enviar el correo de bienvenida.");

  const cliente = aCliente(fila);
  res.status(201).json({
    ok: true,
    cliente,
    mensaje: "Cliente registrado. Contraseña temporal: Axolotl2026",
    avisos,
  });
});

export const actualizarCliente = manejar(async (req, res) => {
  const actual = await buscarPorId(req.params.id);
  const { correo, telefono, contactoNombre, contactoTelefono } = req.body;
  // El estado de la cuenta se cambia solo con cambiar_estado_cliente (Encargado)
  const params = {
    p_id: actual.id,
    p_nombre: nombreCompleto(req.body) || actual.nombre,
    p_telefono: telefono ?? actual.telefono,
    p_gmail: correo || actual.gmail,
    p_estado: actual.estado,
  };
  if (contactoNombre !== undefined || contactoTelefono !== undefined) {
    params.p_contacto_nombre = String(contactoNombre || "").trim();
    params.p_contacto_telefono = String(contactoTelefono || "");
  }
  await rpc("editar_cliente", params);
  if (req.body.salud) await guardarSalud(req.usuario.correo, actual.id, leerSalud(req.body));
  res.json({ ok: true, cliente: aCliente(await buscarPorId(actual.id)) });
});

// Renueva membresía con Efectivo, Tarjeta o Transferencia (con imagen de comprobante)
export const renovarCliente = manejar(async (req, res) => {
  const actual = await buscarPorId(req.params.id);
  const plan = await nombrePlan(req, req.body?.plan || actual.plan);
  if (!plan) {
    return res.status(400).json({ ok: false, mensaje: "El cliente no tiene plan previo; indica uno" });
  }

  const metodo = req.body?.metodo || "Efectivo";

  if (metodo === "Transferencia") {
    const b64 = limpiarBase64(req.body?.comprobante);
    if (!b64) {
      return res.status(400).json({ ok: false, mensaje: "Falta la imagen del comprobante" });
    }
    await rpc("enviar_comprobante", {
      p_gmail: actual.gmail,
      p_plan: plan,
      p_metodo: "Transferencia",
      p_comprobante: b64,
    });
    return res.json({
      ok: true,
      cliente: aCliente(await buscarPorId(actual.id)),
      mensaje: "Comprobante enviado. Pendiente de validación por el Encargado",
    });
  }

  const vence = await rpc("renovar_membresia", {
    p_cliente_id: actual.id,
    p_plan: plan,
    p_registrado_por: req.usuario.correo,
    p_metodo: metodo,
  });
  // Pago en efectivo/tarjeta ya aceptado: el comprobante va al correo registrado del cliente (igual que la app)
  // El recibo y la lectura del cliente actualizado van en paralelo
  const [falla, fila] = await Promise.all([
    vence ? funcionEdge("enviar-recibo", { cliente_id: actual.id }) : null,
    buscarPorId(actual.id),
  ]);
  const avisos = vence
    ? [falla ? `No se pudo enviar el comprobante por correo (${falla}).` : `Comprobante enviado a ${actual.gmail}.`]
    : [];
  res.json({ ok: true, cliente: aCliente(fila), mensaje: "Membresia renovada", vence, avisos });
});

// Solo Encargado (igual que la app): activa la cuenta o la da de baja.
// Usa cambiar_estado_cliente, que tambien valida en la base que quien lo pide sea Encargado.
// Una cuenta INACTIVA no puede entrar al gimnasio, pero se puede reactivar.
export const cambiarEstadoCliente = manejar(async (req, res) => {
  const actual = await buscarPorId(req.params.id);
  const activo = req.body?.activo === true;
  await rpc("cambiar_estado_cliente", {
    p_actor_gmail: req.usuario.correo,
    p_cliente_id: actual.id,
    p_activo: activo,
  });
  res.json({
    ok: true,
    cliente: aCliente(await buscarPorId(actual.id)),
    mensaje: activo ? "Cliente reactivado" : "Cliente dado de baja conforme a términos y políticas",
  });
});

// Solo Encargado:
// - tipo "suspension" (por defecto): da de baja la cuenta (INACTIVA, se puede reactivar).
//   Si no se reactiva, la base la elimina sola tras 365 dias sin uso (avisando 30 dias antes).
// - tipo "arco": Derechos ARCO. Usa eliminar_cliente, igual que la app: borra al cliente y todos
//   sus datos (salud, rostro, accesos, membresias, rutinas, asesorias). No se puede deshacer.
//   Los pagos se conservan sin cliente para los reportes contables y fiscales.
export const eliminarCliente = manejar(async (req, res) => {
  const actual = await buscarPorId(req.params.id);
  const tipo = req.body?.tipo || req.query?.tipo || "suspension";

  if (tipo === "arco") {
    await rpc("eliminar_cliente", { p_actor_gmail: req.usuario.correo, p_cliente_id: actual.id });
    return res.json({ ok: true, mensaje: "Datos personales del cliente eliminados por Derechos ARCO" });
  }

  await rpc("cambiar_estado_cliente", {
    p_actor_gmail: req.usuario.correo,
    p_cliente_id: actual.id,
    p_activo: false,
  });
  res.json({ ok: true, mensaje: "Cliente dado de baja conforme a términos y políticas" });
});
