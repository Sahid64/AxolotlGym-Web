import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import {
  listarClientes, obtenerCliente, obtenerFotoCliente, crearCliente,
  actualizarCliente, renovarCliente, desactivarCliente, eliminarCliente, listarPlanes,
} from "../controllers/clientes.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "encargado", "dueno"));
router.get("/", listarClientes);
router.get("/planes", listarPlanes); // antes de /:id para que no lo tome como id
router.get("/:id/foto", obtenerFotoCliente);
router.get("/:id", obtenerCliente);
router.post("/", crearCliente);
router.put("/:id", actualizarCliente);
router.put("/:id/renovar", renovarCliente);
router.put("/:id/desactivar", desactivarCliente);
// Solo el Encargado / Dueño puede dar de baja o eliminar por Derechos ARCO
router.delete("/:id", permitirRoles("encargado", "dueno"), eliminarCliente);
export default router;
