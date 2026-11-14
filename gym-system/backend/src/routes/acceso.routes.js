import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import { accesoPorRostro, asistenciaHoy } from "../controllers/acceso.controller.js";

// Reconocimiento facial en Recepcion (toma de lista)
const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "encargado", "dueno"));
router.post("/rostro", accesoPorRostro);
router.get("/hoy", asistenciaHoy);
export default router;
