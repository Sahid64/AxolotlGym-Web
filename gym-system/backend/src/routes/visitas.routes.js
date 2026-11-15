import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import { listarVisitas, registrarVisita } from "../controllers/visitas.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "encargado", "dueno"));
router.get("/", listarVisitas);
router.post("/", registrarVisita);
export default router;
