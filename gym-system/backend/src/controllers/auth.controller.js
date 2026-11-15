import jwt from "jsonwebtoken";
import { rpc, manejar, aMinusculas, funcionEdge } from "../data/supabase.js";

const SECRET = process.env.JWT_SECRET || "secreto_dev";

// Usa la misma funcion login_auto de la app Android: verifica la contraseña
// hasheada, el estado ACTIVO y regresa el rol principal del usuario.
async function verificar(identificador, password) {
  const filas = await rpc("login_auto", { p_gmail: identificador ?? "", p_password: password ?? "" });
  return filas?.[0] ?? null;
}

function firmar(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre, correo: usuario.correo },
    SECRET,
    { expiresIn: "8h" }
  );
}

// Login para recepcion / instructores / encargado -> correo y contraseña
export const loginStaff = manejar(async (req, res) => {
  const { correo, password } = req.body;
  const fila = await verificar(correo, password);
  if (!fila) {
    return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
  }
  const rol = aMinusculas(fila.rol);
  if (rol === "cliente") {
    return res.status(403).json({ ok: false, mensaje: "Los clientes ingresan desde la app Axolotl" });
  }
  const usuario = { id: fila.id, nombre: fila.nombre, correo: fila.gmail, rol, estado: "activo" };
  res.json({ ok: true, token: firmar(usuario), usuario });
});

// Login para clientes (app) -> mismo login_auto de la base
export const loginCliente = manejar(async (req, res) => {
  const { numMembresia, correo, password } = req.body;
  const fila = await verificar(correo || numMembresia, password);
  if (!fila || aMinusculas(fila.rol) !== "cliente") {
    return res.status(401).json({ ok: false, mensaje: "Membresia o contraseña incorrectos" });
  }
  const cliente = { id: fila.id, nombre: fila.nombre, correo: fila.gmail, rol: "cliente", codigoQr: fila.codigo_qr };
  res.json({ ok: true, token: firmar(cliente), cliente });
});

// GET /api/auth/mi-foto -> Foto de perfil del usuario de personal con sesión activa
export const obtenerMiFoto = manejar(async (req, res) => {
  const correo = req.usuario?.correo;
  if (!correo) return res.json({ ok: true, foto: null });
  const b64 = await rpc("foto_personal", { p_gmail: correo });
  const foto = b64 ? (String(b64).startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`) : null;
  res.json({ ok: true, foto });
});

// ---- Olvidé mi contraseña (igual que la app) ----
// Paso 1: se revisa que la contraseña nueva cumpla las reglas y se manda un código de 6 dígitos
// al correo (Edge Function enviar-codigo-contrasena). Para no revelar qué correos existen,
// la respuesta es la misma aunque el correo no esté registrado.
export const pedirCodigoContrasena = manejar(async (req, res) => {
  const correo = String(req.body?.correo || "").trim();
  const nueva = String(req.body?.nueva || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return res.status(400).json({ ok: false, mensaje: "Escribe un correo válido" });
  }
  const r = await rpc("revisar_contrasena_nueva", { p_nueva: nueva });
  if (r !== "OK") return res.status(400).json({ ok: false, mensaje: r });
  const falla = await funcionEdge("enviar-codigo-contrasena", { gmail: correo });
  if (falla) return res.status(502).json({ ok: false, mensaje: falla });
  res.json({ ok: true, mensaje: "Si el correo está registrado, te enviamos un código." });
});

// Paso 2: con el código que llegó al correo se cambia la contraseña sin la actual
export const restablecerContrasena = manejar(async (req, res) => {
  const correo = String(req.body?.correo || "").trim();
  const codigo = String(req.body?.codigo || "").trim();
  const nueva = String(req.body?.nueva || "");
  if (!/^\d{6}$/.test(codigo)) return res.status(400).json({ ok: false, mensaje: "El código debe tener 6 dígitos" });
  const r = await rpc("restablecer_contrasena", { p_gmail: correo, p_codigo: codigo, p_nueva: nueva });
  if (r !== "OK") return res.status(400).json({ ok: false, mensaje: r });
  res.json({ ok: true, mensaje: "Contraseña actualizada" });
});
