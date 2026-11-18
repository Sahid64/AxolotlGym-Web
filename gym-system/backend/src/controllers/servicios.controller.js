import { supabase, rpc, consulta, manejar, errorHttp, numero } from "../data/supabase.js";
import { invalidar } from "../data/cache.js";

const tabla = () => supabase.from("servicios");
const aServicio = (s) => ({
  ...s,
  precio: numero(s.precio),
  visible_clientes: s.visible_clientes ?? true,
  visible_recepcion: s.visible_recepcion ?? true,
  es_visita: Boolean(s.es_visita),
});

// Para quién se ve el servicio y si es la visita (igual que la app). Solo puede haber una visita:
// configurar_servicio le quita la marca a la anterior.
const leerConfig = (b) => ({
  visible_clientes: b?.visible_clientes !== false,
  visible_recepcion: b?.visible_recepcion !== false,
  es_visita: b?.es_visita === true,
});

async function configurar(actor, id, c) {
  await rpc("configurar_servicio", {
    p_actor_gmail: actor,
    p_id: id,
    p_clientes: c.visible_clientes,
    p_recepcion: c.visible_recepcion,
    p_es_visita: c.es_visita,
  });
}

function validar({ nombre, duracion, precio }) {
  if (!nombre || !duracion || precio == null || precio === "") {
    throw errorHttp(400, "nombre, duracion y precio son obligatorios");
  }
  return { nombre, duracion: String(duracion), precio: Number(precio) };
}

export const listarServicios = manejar(async (req, res) => {
  const servicios = await consulta(tabla().select("*").order("id"));
  res.json({ ok: true, servicios: servicios.map(aServicio) });
});

export const crearServicio = manejar(async (req, res) => {
  const d = validar(req.body);
  const id = await rpc("crear_servicio", {
    p_actor_gmail: req.usuario.correo,
    p_nombre: d.nombre,
    p_duracion: d.duracion,
    p_precio: d.precio,
  });
  // Un servicio nuevo nace visible para todos y sin ser visita; solo se ajusta si se pidió otra cosa
  const c = leerConfig(req.body);
  let nuevoId = typeof id === "number" ? id : null;
  if (!c.visible_clientes || !c.visible_recepcion || c.es_visita) {
    if (!nuevoId) {
      const filas = await consulta(tabla().select("id").ilike("nombre", d.nombre).order("id", { ascending: false }).limit(1));
      nuevoId = filas[0]?.id ?? null;
    }
    if (nuevoId) await configurar(req.usuario.correo, nuevoId, c);
  }
  invalidar("planes_"); // los planes de Clientes salen de los servicios
  res.status(201).json({ ok: true, servicio: aServicio({ id: nuevoId, ...d, ...c }) });
});

export const actualizarServicio = manejar(async (req, res) => {
  const id = Number(req.params.id);
  const d = validar(req.body);
  await rpc("actualizar_servicio", {
    p_actor_gmail: req.usuario.correo,
    p_id: id,
    p_nombre: d.nombre,
    p_duracion: d.duracion,
    p_precio: d.precio,
  });
  const c = leerConfig(req.body);
  await configurar(req.usuario.correo, id, c);
  invalidar("planes_");
  res.json({ ok: true, servicio: aServicio({ id, ...d, ...c }) });
});

export const eliminarServicio = manejar(async (req, res) => {
  await rpc("eliminar_servicio", {
    p_actor_gmail: req.usuario.correo,
    p_id: Number(req.params.id),
  });
  invalidar("planes_");
  res.json({ ok: true, mensaje: "Servicio eliminado" });
});
