import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import {
  listarReportes, listarCancelaciones, listarSolicitudesCancelacion, resolverCancelacion, entregarReembolso,
} from "../controllers/reportes.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("encargado", "dueno"));
router.get("/", listarReportes);
router.get("/cancelaciones", listarCancelaciones);
router.get("/solicitudes-cancelacion", listarSolicitudesCancelacion);
router.put("/solicitudes-cancelacion/:id", resolverCancelacion);
router.put("/reembolsos/:pagoId/entregar", entregarReembolso);
export default router;
