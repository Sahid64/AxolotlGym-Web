import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import { listarAvisos, crearAviso, enviarPendientes } from "../controllers/avisos.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("encargado", "dueno"));
router.get("/", listarAvisos);
router.post("/", crearAviso);
router.post("/enviar", enviarPendientes);
export default router;
