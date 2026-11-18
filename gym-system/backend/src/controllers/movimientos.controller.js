// Movimientos por rol (bitácora de auditoría). Solo el Encargado.
// Lee la función SQL movimientos_de_rol (sql/auditoria.sql), que ya valida que quien
// consulta sea Encargado. La paginación es por bloques con p_limite / p_offset.
import { rpc, manejar, aMayusculas } from "../data/supabase.js";

const ROLES = ["ENCARGADO", "RECEPCION", "INSTRUCTOR", "CLIENTE", "SIN ROL"];

export const listarMovimientos = manejar(async (req, res) => {
  const rol = aMayusculas(String(req.query.rol || "").trim());
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const filas = await rpc("movimientos_de_rol", {
    p_actor_gmail: req.usuario.correo,
    p_rol: ROLES.includes(rol) ? rol : null,
    p_limite: limite,
    p_offset: offset,
  });

  res.json({
    ok: true,
    hayMas: (filas || []).length === limite,
    movimientos: (filas || []).map((f) => ({
      id: f.id,
      rol: f.rol,
      usuario: f.usuario,
      gmail: f.gmail,
      tipoAccion: f.tipo_accion,
      modulo: f.modulo,
      descripcion: f.descripcion,
      valoresAnteriores: f.valores_anteriores,
      valoresNuevos: f.valores_nuevos,
      fechaHoraMx: f.fecha_hora_mx,
    })),
  });
});
