import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import { listarMovimientos } from "../controllers/movimientos.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("encargado", "dueno"));
router.get("/", listarMovimientos);
export default router;
