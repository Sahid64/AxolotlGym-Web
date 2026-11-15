// Avisos por correo (comunicados), igual que la sección "Avisos" de la app. Solo el Encargado.
// Se guardan con crear_comunicado y los correos los manda la Edge Function enviar-comunicados;
// lo que no salga hoy se reintenta cada mañana (avisos-diarios).
import { supabase, rpc, consulta, manejar, errorHttp, funcionEdge } from "../data/supabase.js";

const TIPOS = ["TERMINOS", "PRIVACIDAD", "HORARIO"];

export const listarAvisos = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("comunicados_lista").select("*").order("creado_en", { ascending: false }));
  res.json({
    ok: true,
    avisos: filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      titulo: f.titulo,
      mensaje: f.mensaje,
      fechaVigor: f.fecha_vigor,
      creadoEn: f.creado_en,
      publico: f.publico,
      destinatarios: Number(f.destinatarios || 0),
      enviados: Number(f.enviados || 0),
    })),
  });
});

export const crearAviso = manejar(async (req, res) => {
  const { tipo, titulo, mensaje, fechaVigor } = req.body || {};
  if (!TIPOS.includes(tipo)) throw errorHttp(400, "Tipo de comunicado no válido");
  await rpc("crear_comunicado", {
    p_actor_gmail: req.usuario.correo,
    p_tipo: tipo,
    p_titulo: String(titulo || "").trim(),
    p_mensaje: String(mensaje || "").trim(),
    p_fecha_vigor: fechaVigor ? String(fechaVigor).slice(0, 10) : null,
  });
  const falla = await funcionEdge("enviar-comunicados");
  res.status(201).json({
    ok: true,
    enviado: !falla,
    mensaje: falla
      ? `El aviso quedó publicado, pero los correos no salieron todavía (${falla}). Se reintentará mañana.`
      : "Aviso publicado y enviado por correo.",
  });
});

// Reintenta los correos pendientes
export const enviarPendientes = manejar(async (req, res) => {
  const falla = await funcionEdge("enviar-comunicados");
  if (falla) return res.status(502).json({ ok: false, mensaje: `No se pudieron enviar los correos: ${falla}` });
  res.json({ ok: true, mensaje: "Correos pendientes enviados." });
});
