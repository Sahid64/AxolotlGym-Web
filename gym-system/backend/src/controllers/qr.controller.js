import { supabase, rpc, consulta, manejar, aMinusculas } from "../data/supabase.js";

// Respuestas de _registrar_movimiento (la misma logica que usa el acceso facial de la app)
const RESPUESTAS = {
  ENTRADA: (n) => [200, `Bienvenido ${n}`],
  SALIDA: (n) => [200, `Hasta pronto ${n}`],
  YA_DENTRO: (n) => [409, `${n} ya tiene una entrada registrada`],
  SIN_ENTRADA: (n) => [409, `${n} no tiene una entrada registrada hoy`],
  DENEGADO: () => [403, "Membresia vencida. Pasa a renovar"],
  REPETIDO: () => [409, "Movimiento repetido, espera unos segundos"],
  NO_RECONOCIDO: () => [404, "Membresia no encontrada"],
};

// Lista de clientes actualmente dentro del gimnasio (usando clientes_dentro de Supabase)
export const listarClientesDentro = manejar(async (req, res) => {
  const dentroLista = (await rpc("clientes_dentro")) || [];
  if (!dentroLista.length) {
    return res.json({ ok: true, dentro: 0, clientes: [] });
  }

  const ids = dentroLista.map((d) => Number(d.cliente_id));
  const filas = await consulta(
    supabase.from("clientes_lista").select("id, nombre, numero_membresia, plan, estado, activa").in("id", ids)
  );
  const porId = Object.fromEntries((filas || []).map((f) => [Number(f.id), f]));

  const clientes = dentroLista.map((d) => {
    const info = porId[Number(d.cliente_id)] || {};
    const vigente = info.activa && info.estado === "ACTIVO";
    return {
      id: Number(d.cliente_id),
      nombre: info.nombre || `Cliente #${d.cliente_id}`,
      numMembresia: info.numero_membresia || "—",
      plan: aMinusculas(info.plan) || "",
      estado: vigente ? "activo" : "inactivo",
      desde: d.desde || null,
    };
  });

  res.json({ ok: true, dentro: clientes.length, clientes });
});

// Sacar manualmente a un cliente que se encuentra dentro del gimnasio
export const registrarSalidaManual = manejar(async (req, res) => {
  const clienteId = Number(req.body?.clienteId);
  if (!clienteId) {
    return res.status(400).json({ ok: false, mensaje: "Cliente no valido" });
  }

  const filas = await consulta(
    supabase.from("clientes_lista").select("id, nombre").eq("id", clienteId).limit(1)
  );
  const nombre = filas?.[0]?.nombre || "El cliente";

  const [r] = await rpc("registrar_movimiento_manual", {
    p_cliente_id: clienteId,
    p_es_entrada: false,
  });
  const respuesta = RESPUESTAS[r?.r_resultado] || (() => [500, "Resultado desconocido"]);
  const [status, mensaje] = respuesta(r?.r_nombre || nombre);
  res.status(status).json({ ok: status === 200, mensaje, dentro: r?.r_dentro_total });
});

// Recepcion registra entrada o salida por numero de membresia o codigo
export const registrarEntrada = manejar(async (req, res) => {
  const { numMembresia, tipo } = req.body;
  const codigo = String(numMembresia || "").trim();
  // Solo letras, numeros, guion y guion bajo (evita romper el filtro de Supabase)
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(codigo)) {
    return res.status(400).json({ ok: false, mensaje: "Codigo no valido" });
  }
  const filas = await consulta(
    supabase.from("clientes_lista").select("id, nombre").or(`numero_membresia.eq.${codigo},codigo_qr.eq.${codigo}`).limit(1)
  );
  if (!filas.length) return res.status(404).json({ ok: false, mensaje: "Membresia no encontrada" });

  const [r] = await rpc("registrar_movimiento_manual", {
    p_cliente_id: filas[0].id,
    p_es_entrada: tipo !== "salida",
  });
  const respuesta = RESPUESTAS[r?.r_resultado] || (() => [500, "Resultado desconocido"]);
  const [status, mensaje] = respuesta(r?.r_nombre || filas[0].nombre);
  res.status(status).json({ ok: status === 200, mensaje, dentro: r?.r_dentro_total });
});
