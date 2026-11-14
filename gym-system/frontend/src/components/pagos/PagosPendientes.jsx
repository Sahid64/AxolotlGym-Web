import { useEffect, useRef, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Boton from "../ui/Boton.jsx";
import Modal from "../ui/Modal.jsx";

const dinero = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

const fechaApp = (iso, esIngles = false) =>
  iso
    ? new Date(iso).toLocaleDateString(esIngles ? "en-US" : "es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

/**
 * Pagos pendientes de validar (equivale a PagosScreen de la app en Kotlin).
 * - puedeVerComprobante=true  -> Encargado / Dueño: ve la imagen y puede resolver todo.
 * - puedeVerComprobante=false -> Recepción: sin imagen, y solo resuelve pagos que
 *   no sean transferencia (igual que confirmar_pago en la BD).
 */
export default function PagosPendientes({ puedeVerComprobante = false }) {
  const { tr, esIngles, traducirMsg, traducirPlan } = useIdioma();
  const [pagos, setPagos] = useState([]);
  const [imagenes, setImagenes] = useState({}); // id -> dataURI | null
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(null); // { pago, aceptar }
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [ampliada, setAmpliada] = useState(null);
  const pedidas = useRef(new Set()); // comprobantes ya solicitados

  const msgError = (e, base) => `${base}: ${traducirMsg(e.response?.data?.mensaje) || e.message}`;

  useEffect(() => {
    recargar();
  }, []);

  async function recargar() {
    try {
      const { data } = await api.get("/pagos");
      setPagos(data.pagos);
      setError("");
      if (puedeVerComprobante) {
        data.pagos
          .filter((p) => p.tieneComprobante && !pedidas.current.has(p.id))
          .forEach((p) => cargarImagen(p.id));
      }
    } catch (e) {
      setError(msgError(e, tr.pagos.errorCargar));
    } finally {
      setCargando(false);
    }
  }

  async function cargarImagen(id) {
    pedidas.current.add(id);
    try {
      const { data } = await api.get(`/pagos/${id}/comprobante`);
      setImagenes((prev) => ({ ...prev, [id]: data.comprobante }));
    } catch {
      setImagenes((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function resolver() {
    const { pago, aceptar } = confirmar;
    setProcesando(true);
    try {
      if (aceptar) {
        await api.put(`/pagos/${pago.id}/aceptar`);
        setMensaje(tr.pagos.pagoValidadoMsg(pago.cliente));
      } else {
        await api.put(`/pagos/${pago.id}/rechazar`, { motivo: motivo.trim() });
        setMensaje(tr.pagos.pagoRechazadoMsg(pago.cliente));
      }
      setError("");
      await recargar();
    } catch (e) {
      setMensaje("");
      setError(msgError(e, tr.pagos.errorGuardar));
    } finally {
      setProcesando(false);
      setConfirmar(null);
    }
  }

  const puedeResolver = (p) => puedeVerComprobante || p.metodo !== "Transferencia";

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--c-texto)]">{tr.pagos.titulo}</h1>
      <p className="text-sm text-[var(--c-texto-sec)] mb-6">{tr.pagos.pendientes(pagos.length)}</p>

      {mensaje && <p className="text-sm text-center text-[var(--c-verde)] mb-3">{mensaje}</p>}
      {error && <p className="text-sm text-center text-[var(--c-rojo)] mb-3">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pagos.map((pago) => (
          <PagoCard
            key={pago.id}
            pago={pago}
            tr={tr}
            esIngles={esIngles}
            traducirPlan={traducirPlan}
            mostrarImagen={puedeVerComprobante}
            imagen={imagenes[pago.id]}
            cargandoImagen={puedeVerComprobante && pago.tieneComprobante && imagenes[pago.id] === undefined}
            habilitado={!procesando && puedeResolver(pago)}
            soloEncargado={!puedeResolver(pago)}
            onAmpliar={setAmpliada}
            onAceptar={() => setConfirmar({ pago, aceptar: true })}
            onRechazar={() => {
              setMotivo("");
              setConfirmar({ pago, aceptar: false });
            }}
          />
        ))}
      </div>

      {pagos.length === 0 && !cargando && !error && (
        <p className="text-center text-sm text-[var(--c-texto-sec)] mt-10">
          {tr.pagos.sinPendientes}
        </p>
      )}

      {/* Confirmación aceptar / rechazar */}
      <Modal
        abierto={!!confirmar}
        titulo={confirmar?.aceptar ? tr.pagos.modalAceptarTitulo : tr.pagos.modalRechazarTitulo}
        onClose={() => !procesando && setConfirmar(null)}
      >
        {confirmar && (
          <div>
            <p className="text-sm text-center text-[var(--c-texto-sec)] mb-4">
              {confirmar.aceptar
                ? tr.pagos.confirmarAceptarMsg(dinero(confirmar.pago.monto), confirmar.pago.cliente)
                : tr.pagos.confirmarRechazarMsg(confirmar.pago.cliente)}
            </p>

            {!confirmar.aceptar && (
              <label className="block mb-4">
                <span className="block text-sm font-medium text-[var(--c-texto-sec)] mb-1">
                  {tr.pagos.motivoRechazo}
                </span>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={motivo}
                  disabled={procesando}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={tr.pagos.motivoPlaceholder}
                  className="w-full bg-[var(--c-campo)] border border-[var(--c-borde)] text-[var(--c-texto)] placeholder:text-[var(--c-texto-tenue)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--c-rojo)]"
                />
              </label>
            )}

            <div className="flex items-center justify-center gap-3">
              <Boton variante="outline" className="flex-1" disabled={procesando} onClick={() => setConfirmar(null)}>
                {tr.cancelar}
              </Boton>
              <Boton
                variante={confirmar.aceptar ? "exito" : "peligro"}
                className="flex-1"
                disabled={procesando || (!confirmar.aceptar && motivo.trim().length < 3)}
                onClick={resolver}
              >
                {confirmar.aceptar ? tr.pagos.aceptar : tr.pagos.rechazar}
              </Boton>
            </div>
          </div>
        )}
      </Modal>

      {/* Comprobante ampliado */}
      <Modal abierto={!!ampliada} titulo={tr.pagos.comprobanteModalTitulo} onClose={() => setAmpliada(null)}>
        {ampliada && <img src={ampliada} alt={tr.pagos.comprobanteModalTitulo} className="w-full max-h-[70vh] object-contain" />}
      </Modal>
    </div>
  );
}

/** Tarjeta con: cliente, plan, monto, método, comprobante y botones. */
function PagoCard({
  pago, tr, esIngles, traducirPlan, mostrarImagen, imagen, cargandoImagen, habilitado, soloEncargado,
  onAmpliar, onAceptar, onRechazar,
}) {
  return (
    <div className="bg-[var(--c-tarjeta)] border border-[var(--c-borde)] rounded-lg p-5 flex flex-col text-center">
      <p className="text-lg font-bold text-[var(--c-texto)]">{pago.cliente}</p>
      {pago.numMembresia && <p className="text-xs text-[var(--c-texto-sec)]">{pago.numMembresia}</p>}

      <p className="mt-2 text-sm font-medium text-[var(--c-acento)]">
        {tr.pagos.planLabel}: {traducirPlan(pago.plan) || "—"} · {dinero(pago.monto)}
      </p>
      <p className="text-xs text-[var(--c-texto-sec)]">
        {tr.clientes?.metodos?.[pago.metodo] || pago.metodo} · {tr.pagos.enviadoEl} {fechaApp(pago.fecha, esIngles)}
      </p>

      {/* Comprobante (la imagen solo la ve el Encargado) */}
      <div className="mt-3 min-h-[160px] max-h-[260px] rounded-lg bg-[var(--c-fondo)] flex items-center justify-center overflow-hidden">
        {mostrarImagen && imagen ? (
          <img
            src={imagen}
            alt={`Comprobante de ${pago.cliente}`}
            onClick={() => onAmpliar(imagen)}
            className="w-full h-full max-h-[260px] object-contain cursor-zoom-in"
          />
        ) : mostrarImagen && cargandoImagen ? (
          <span className="text-xs text-[var(--c-texto-sec)]">{tr.pagos.cargandoComprobante}</span>
        ) : (
          <div className="text-center px-3">
            <p className="text-3xl text-[var(--c-texto-sec)]">🖼</p>
            <p className="text-xs text-[var(--c-texto-sec)]">
              {!pago.tieneComprobante
                ? tr.pagos.sinComprobante
                : mostrarImagen
                ? tr.pagos.errorComprobante
                : tr.pagos.soloEncargadoImg}
            </p>
          </div>
        )}
      </div>
      {mostrarImagen && imagen && (
        <p className="text-[11px] text-[var(--c-texto-sec)] mt-1">{tr.pagos.clicAmpliar}</p>
      )}

      <div className="mt-3 flex gap-3">
        <Boton variante="peligro" className="flex-1 font-bold" disabled={!habilitado} onClick={onRechazar}>
          {tr.pagos.rechazar}
        </Boton>
        <Boton variante="exito" className="flex-1 font-bold" disabled={!habilitado} onClick={onAceptar}>
          {tr.pagos.aceptar}
        </Boton>
      </div>
      {soloEncargado && (
        <p className="text-[11px] text-[var(--c-texto-sec)] mt-2 text-center">
          {tr.pagos.soloEncargadoValidar}
        </p>
      )}
    </div>
  );
}
