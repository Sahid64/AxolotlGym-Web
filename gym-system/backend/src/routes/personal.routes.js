// Rutas del PERSONAL (recepcion, instructores, encargados). Solo el encargado las usa.
import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import {
  listarPersonal, obtenerFotoPersonal, crearPersonal, actualizarPersonal, eliminarPersonal,
  obtenerSaludPersonal, guardarFotoPersonal,
} from "../controllers/personal.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("encargado", "dueno"));
router.get("/", listarPersonal);
router.get("/:id/foto", obtenerFotoPersonal);
router.put("/:id/foto", guardarFotoPersonal);
router.get("/:id/salud", obtenerSaludPersonal);
router.post("/", crearPersonal);
router.put("/:id", actualizarPersonal);
router.delete("/:id", eliminarPersonal);
export default router;
