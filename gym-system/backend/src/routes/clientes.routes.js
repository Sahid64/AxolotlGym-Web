import { Router } from "express";
import { verificarToken, permitirRoles } from "../middleware/auth.js";
import {
  listarClientes, obtenerCliente, crearCliente,
  actualizarCliente, renovarCliente, eliminarCliente, listarPlanes,
} from "../controllers/clientes.controller.js";
import { clientesConRostro, registrarRostro } from "../controllers/acceso.controller.js";

const router = Router();
router.use(verificarToken, permitirRoles("recepcion", "encargado", "dueno"));
router.get("/", listarClientes);
router.get("/planes", listarPlanes); // antes de /:id para que no lo tome como id
router.get("/rostros", clientesConRostro); // ids con rostro registrado (tambien antes de /:id)
router.get("/:id", obtenerCliente);
router.post("/", crearCliente);
router.put("/:id", actualizarCliente);
router.put("/:id/renovar", renovarCliente);
router.post("/:id/rostro", registrarRostro);
router.delete("/:id", eliminarCliente);
export default router;
