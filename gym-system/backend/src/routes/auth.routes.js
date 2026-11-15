import { Router } from "express";
import { verificarToken } from "../middleware/auth.js";
import {
  loginStaff, loginCliente, obtenerMiFoto, pedirCodigoContrasena, restablecerContrasena,
} from "../controllers/auth.controller.js";

const router = Router();
router.post("/login", loginStaff);         // recepcion, instructor, encargado, dueno
router.post("/login-cliente", loginCliente); // app Android del cliente
router.get("/mi-foto", verificarToken, obtenerMiFoto);
// Olvidé mi contraseña: código por correo (sin sesión, igual que la app)
router.post("/recuperar/codigo", pedirCodigoContrasena);
router.post("/recuperar/confirmar", restablecerContrasena);
export default router;
