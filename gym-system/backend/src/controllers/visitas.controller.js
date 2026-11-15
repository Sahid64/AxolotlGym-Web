// Visitas (pase de un día), igual que la app: no crean cliente ni membresía.
// El precio es el del servicio marcado como "Es la visita" en Servicios y el cobro
// entra directo en los ingresos. El Encargado siempre puede cobrarla; Recepción solo
// si la visita es visible para Recepción (la base lo valida en registrar_visita).
import { supabase, rpc, consulta, manejar, numero } from "../data/supabase.js";

export const listarVisitas = manejar(async (req, res) => {
  const [servicios, visitas] = await Promise.all([
    consulta(supabase.from("servicios").select("precio, visible_recepcion, es_visita").eq("es_visita", true).limit(1)),
    consulta(supabase.from("visitas_hoy").select("*")),
  ]);
  const visita = servicios[0];
  res.json({
    ok: true,
    precio: numero(visita?.precio),
    visibleRecepcion: Boolean(visita?.visible_recepcion),
    visitas: visitas.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      telefono: v.telefono,
      monto: numero(v.monto),
      metodo: v.metodo_pago,
      hora: v.hora,
      registro: v.registro ?? null,
    })),
  });
});

export const registrarVisita = manejar(async (req, res) => {
  const { nombre, telefono, contactoNombre, contactoTelefono, metodo } = req.body || {};
  await rpc("registrar_visita", {
    p_actor_gmail: req.usuario.correo,
    p_nombre: String(nombre || "").trim(),
    p_telefono: String(telefono || ""),
    p_contacto_nombre: String(contactoNombre || "").trim(),
    p_contacto_telefono: String(contactoTelefono || ""),
    p_metodo: metodo === "Tarjeta" ? "Tarjeta" : "Efectivo",
  });
  res.status(201).json({ ok: true, mensaje: `Visita de ${String(nombre || "").trim()} cobrada.` });
});
