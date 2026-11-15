import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import {
  listarClientes, obtenerCliente, obtenerFotoCliente, crearCliente,
  actualizarCliente, renovarCliente, cambiarEstadoCliente, eliminarCliente, listarPlanes,
  obtenerDetalleCliente, evaluarCancelacion, solicitarCancelacion, cancelacionesPendientes,
} from "../controllers/clientes.controller.js";
import { clientesConRostro, registrarRostro } from "../controllers/acceso.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "encargado", "dueno"));
router.get("/", listarClientes);
router.get("/planes", listarPlanes); // antes de /:id para que no lo tome como id
router.get("/rostros", clientesConRostro); // ids con rostro registrado (tambien antes de /:id)
router.get("/cancelaciones-pendientes", cancelacionesPendientes); // ids con cancelación por autorizar
router.get("/:id/detalle", obtenerDetalleCliente); // contacto de emergencia y datos de salud
router.get("/:id/cancelacion", evaluarCancelacion); // vista previa de la política (?tipo=)
router.post("/:id/cancelacion", solicitarCancelacion); // la autoriza el Encargado en Reportes
router.get("/:id/foto", obtenerFotoCliente);
router.get("/:id", obtenerCliente);
router.post("/", crearCliente);
router.put("/:id", actualizarCliente);
router.put("/:id/renovar", renovarCliente);
// Solo el Encargado / Dueño activa o da de baja la cuenta (igual que la app)
router.put("/:id/estado", permitirRoles("encargado", "dueno"), cambiarEstadoCliente);
router.post("/:id/rostro", registrarRostro);
// Solo el Encargado / Dueño puede dar de baja o eliminar por Derechos ARCO
router.delete("/:id", permitirRoles("encargado", "dueno"), eliminarCliente);
export default router;
