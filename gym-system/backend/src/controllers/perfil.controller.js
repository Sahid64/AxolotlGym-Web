// Perfil del personal que inició sesión (igual que el Perfil de Recepción de la app).
// Siempre usa el correo del token: cada quien solo ve y cambia lo suyo.
import { rpc, manejar, errorHttp, aMinusculas } from "../data/supabase.js";

export const obtenerPerfil = manejar(async (req, res) => {
  const filas = await rpc("perfil_personal", { p_gmail: req.usuario.correo });
  const p = filas?.[0];
  if (!p) throw errorHttp(404, "No se encontró tu perfil");
  res.json({
    ok: true,
    perfil: {
      id: p.r_id,
      nombre: p.r_nombre,
      correo: p.r_gmail,
      telefono: p.r_telefono || "",
      estado: aMinusculas(p.r_estado),
      fechaRegistro: p.r_fecha_registro,
      rol: req.usuario.rol,
    },
  });
});

export const editarMiTelefono = manejar(async (req, res) => {
  const telefono = String(req.body?.telefono || "");
  if (!/^\d{10}$/.test(telefono)) throw errorHttp(400, "El teléfono debe tener 10 dígitos");
  await rpc("editar_mi_telefono", { p_gmail: req.usuario.correo, p_telefono: telefono });
  res.json({ ok: true, mensaje: "Teléfono actualizado" });
});

export const cambiarMiContrasena = manejar(async (req, res) => {
  const { actual, nueva } = req.body || {};
  if (!actual || !nueva) throw errorHttp(400, "Escribe tu contraseña actual y la nueva");
  const r = await rpc("cambiar_contrasena", { p_gmail: req.usuario.correo, p_actual: actual, p_nueva: nueva });
  if (r !== "OK") throw errorHttp(400, r || "No se pudo cambiar la contraseña");
  res.json({ ok: true, mensaje: "Contraseña actualizada" });
});
