import { supabase, rpc, consulta, manejar, errorHttp } from "../data/supabase.js";

// Acceso por reconocimiento facial (toma de lista).
// Usa las mismas funciones de Supabase que la app Android (sql/reconocimiento_facial.sql):
// el navegador calcula el vector del rostro (192 numeros, MobileFaceNet) y aqui solo se compara.
// No se guardan fotos para identificar: solo viaja el vector.

const DIMENSION = 192;

/** Valida que llegue un vector de 192 numeros. Lanza 400 si no. */
export function vectorFacial(valor) {
  if (!Array.isArray(valor) || valor.length !== DIMENSION || !valor.every((x) => Number.isFinite(x))) {
    throw errorHttp(400, "Vector facial inválido");
  }
  return valor.map(Number);
}

// Mensajes para cada resultado de _registrar_movimiento
const MENSAJES = {
  ENTRADA: (n) => `Bienvenido ${n}`,
  SALIDA: (n) => `Hasta pronto ${n}`,
  YA_DENTRO: (n) => `${n} ya tiene una entrada registrada`,
  SIN_ENTRADA: (n) => `${n} no tiene una entrada registrada hoy`,
  DENEGADO: () => "Membresia vencida. Pasa a renovar",
  REPETIDO: () => "Movimiento repetido, espera unos segundos",
  NO_RECONOCIDO: () => "Rostro no reconocido",
};

// POST /api/acceso/rostro  { embedding: number[192] }
// Identifica al cliente y registra ENTRADA o SALIDA automaticamente (alterna segun su estado).
export const accesoPorRostro = manejar(async (req, res) => {
  const embedding = vectorFacial(req.body?.embedding);
  const [r] = (await rpc("acceso_por_rostro", { p_embedding: embedding })) || [];
  const resultado = r?.r_resultado || "NO_RECONOCIDO";
  const mensaje = (MENSAJES[resultado] || (() => "Resultado desconocido"))(r?.r_nombre || "");

  res.json({
    ok: resultado === "ENTRADA" || resultado === "SALIDA",
    resultado,
    mensaje,
    cliente: r?.r_cliente_id
      ? {
          id: r.r_cliente_id,
          nombre: r.r_nombre,
          numMembresia: r.r_membresia,
          estado: r.r_activa ? "activo" : "inactivo",
        }
      : null,
    esEntrada: r?.r_es_entrada ?? null,
    fechaHora: r?.r_fecha_hora ?? null,
    entradaDesde: r?.r_entrada_desde ?? null,
    dentro: r?.r_dentro_total ?? 0,
    similitud: r?.r_similitud ?? null,
  });
});

// GET /api/acceso/hoy -> quien esta dentro ahora (lista de asistencia del dia)
export const asistenciaHoy = manejar(async (req, res) => {
  const dentro = (await rpc("clientes_dentro")) || [];
  const ids = dentro.map((d) => d.cliente_id);

  let nombres = {};
  if (ids.length) {
    const filas = await consulta(
      supabase.from("clientes_lista").select("id, nombre, numero_membresia").in("id", ids)
    );
    nombres = Object.fromEntries(filas.map((f) => [f.id, f]));
  }

  const lista = dentro
    .map((d) => ({
      id: d.cliente_id,
      nombre: nombres[d.cliente_id]?.nombre || `#${d.cliente_id}`,
      numMembresia: nombres[d.cliente_id]?.numero_membresia || "",
      desde: d.desde,
    }))
    .sort((a, b) => (a.desde < b.desde ? 1 : -1)); // el mas reciente primero

  res.json({ ok: true, total: lista.length, dentro: lista });
});

// GET /api/clientes/rostros -> ids de clientes que ya tienen rostro registrado
export const clientesConRostro = manejar(async (req, res) => {
  const filas = (await rpc("clientes_rostro_registrado")) || [];
  res.json({ ok: true, ids: filas.map((f) => f.cliente_id) });
});

// POST /api/clientes/:id/rostro  { embedding: number[192], foto?: base64 JPEG }
// Registra o actualiza el rostro del cliente. La foto solo se guarda si aun no tiene una.
export const registrarRostro = manejar(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw errorHttp(400, "Cliente no valido");
  const embedding = vectorFacial(req.body?.embedding);

  let foto = req.body?.foto ?? null;
  if (foto != null && (typeof foto !== "string" || foto.length > 200_000 || !/^[A-Za-z0-9+/=]+$/.test(foto))) {
    foto = null; // foto rara o muy grande: se ignora, el rostro igual se registra
  }

  await rpc("registrar_rostro_cliente", { p_cliente_id: id, p_embedding: embedding, p_foto: foto });
  res.json({ ok: true, mensaje: "Rostro registrado" });
});
