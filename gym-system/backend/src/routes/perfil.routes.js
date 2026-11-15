import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import { obtenerPerfil, editarMiTelefono, cambiarMiContrasena } from "../controllers/perfil.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "encargado", "dueno"));
router.get("/", obtenerPerfil);
router.put("/telefono", editarMiTelefono);
router.put("/contrasena", cambiarMiContrasena);
export default router;
