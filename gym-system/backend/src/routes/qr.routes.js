import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import { registrarEntrada, listarClientesDentro, registrarSalidaManual } from "../controllers/qr.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "instructor", "encargado", "dueno"));

router.get("/dentro", listarClientesDentro);
router.post("/salida-manual", registrarSalidaManual);
router.post("/registrar", registrarEntrada);

export default router;
