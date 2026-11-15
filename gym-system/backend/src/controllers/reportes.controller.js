import { supabase, rpc, consulta, manejar, errorHttp, numero } from "../data/supabase.js";

// Reporte de los ultimos 6 meses (vista reporte_mensual, la misma de la app)
export const listarReportes = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("reporte_mensual").select("*"));
  const reportes = filas
    .map((f) => {
      const servicio = numero(f.servicios);
      const asesorias = numero(f.asesorias);
      const gastos = numero(f.gastos);
      return { id: f.periodo, periodo: f.periodo, servicio, asesorias, gastos, total: servicio + asesorias - gastos };
    })
    .sort((a, b) => (a.periodo < b.periodo ? 1 : -1));
  res.json({ ok: true, reportes });
});
// ---- Cancelaciones y reembolsos (igual que la sección de Reportes de la app) ----

// Cancelaciones de membresía, las más recientes primero
export const listarCancelaciones = manejar(async (req, res) => {
  const filas = await consulta(
    supabase.from("cancelaciones_lista").select("*").eq("tipo", "MEMBRESIA").order("cancelada_en", { ascending: false })
  );
  res.json({
    ok: true,
    cancelaciones: filas.map((f) => ({
      id: f.id,
      canceladaEn: f.cancelada_en,
      cliente: f.cliente,
      numeroMembresia: f.numero_membresia,
      detalle: f.detalle,
      motivo: f.motivo,
      autorizo: f.autorizo,
      solicito: f.solicito,
      reembolso: numero(f.reembolso),
      tipoCancelacion: f.tipo_cancelacion,
      sigueActiva: Boolean(f.sigue_activa),
      fechaFin: f.fecha_fin,
      reembolsoId: f.reembolso_id,
      estadoReembolso: f.estado_reembolso,
      metodoReembolso: f.metodo_reembolso,
      fechaLimite: f.fecha_limite,
      entregadoEn: f.entregado_en,
    })),
  });
});

// Solicitudes de cancelación por autorizar, las más antiguas primero,
// con lo que aplicaría si el Encargado autoriza ahora
export const listarSolicitudesCancelacion = manejar(async (req, res) => {
  const filas = await consulta(
    supabase.from("solicitudes_cancelacion_pendientes").select("*").order("solicitada_en", { ascending: true })
  );
  res.json({
    ok: true,
    solicitudes: filas.map((f) => ({
      id: f.id,
      clienteId: f.cliente_id,
      cliente: f.cliente,
      numeroMembresia: f.numero_membresia,
      tipo: f.tipo,
      motivo: f.motivo,
      solicitadaEn: f.solicitada_en,
      solicito: f.solicito,
      plan: f.plan,
      fechaFin: f.fecha_fin,
      horas: f.horas == null ? null : Number(f.horas),
      reembolso: numero(f.reembolso),
      metodo: f.metodo,
      regla: f.regla,
      fechaLimite: f.fecha_limite,
    })),
  });
});

// Autorizar o rechazar. Al rechazar, la nota (motivo) es obligatoria.
export const resolverCancelacion = manejar(async (req, res) => {
  const autorizar = req.body?.autorizar === true;
  const nota = String(req.body?.nota || "").trim();
  if (!autorizar && nota.length < 3) throw errorHttp(400, "Escribe el motivo del rechazo");
  await rpc("resolver_cancelacion", {
    p_actor_gmail: req.usuario.correo,
    p_solicitud_id: Number(req.params.id),
    p_autorizar: autorizar,
    p_nota: nota || null,
  });
  res.json({ ok: true, mensaje: autorizar ? "Cancelación autorizada" : "Solicitud rechazada" });
});

// Desde ese momento el reembolso resta en los reportes
export const entregarReembolso = manejar(async (req, res) => {
  await rpc("entregar_reembolso", { p_actor_gmail: req.usuario.correo, p_pago_id: Number(req.params.pagoId) });
  res.json({ ok: true, mensaje: "Reembolso marcado como entregado" });
});
