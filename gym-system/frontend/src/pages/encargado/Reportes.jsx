import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ResultadoPolitica from "../../components/clientes/ResultadoPolitica.jsx";
import { dinero, fecha, hoyLocal, campoClase, tarjetaClase } from "../../utils/formato.js";

export default function Reportes() {
  const { tr, traducirMsg, esIngles } = useIdioma();
  const t = tr.reportesExtra;
  const [reportes, setReportes] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cancelaciones, setCancelaciones] = useState([]);
  const [aviso, setAviso] = useState(null); // { ok, texto }

  // Autorizar / rechazar una solicitud de cancelación (igual que la app)
  const [resolviendo, setResolviendo] = useState(null); // { solicitud, autorizar }
  const [nota, setNota] = useState("");
  const [errorModal, setErrorModal] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Marcar un reembolso como entregado
  const [entregando, setEntregando] = useState(null);

  // "2026-01" (o "2026-01-15") -> "Enero 2026" / "January 2026"
  function formatearPeriodo(periodo) {
    const m = /^(\d{4})-(\d{2})/.exec(String(periodo));
    if (!m) return periodo;
    const nombreMes = tr.reportes.meses[Number(m[2]) - 1];
    return nombreMes ? `${nombreMes} ${m[1]}` : periodo;
  }

  function cargar() {
    api.get("/reportes").then((r) => setReportes(r.data.reportes)).catch(() => {});
    api.get("/reportes/solicitudes-cancelacion").then((r) => setSolicitudes(r.data.solicitudes)).catch(() => {});
    api.get("/reportes/cancelaciones").then((r) => setCancelaciones(r.data.cancelaciones)).catch(() => {});
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirResolver(solicitud, autorizar) {
    setResolviendo({ solicitud, autorizar });
    setNota("");
    setErrorModal("");
  }

  async function resolver() {
    const { solicitud, autorizar } = resolviendo;
    if (!autorizar && nota.trim().length < 3) {
      setErrorModal(t.motivoRechazoMin);
      return;
    }
    setProcesando(true);
    try {
      await api.put(`/reportes/solicitudes-cancelacion/${solicitud.id}`, { autorizar, nota: nota.trim() || undefined });
      setAviso({ ok: true, texto: autorizar ? t.autorizada(solicitud.cliente) : t.rechazada(solicitud.cliente) });
      setResolviendo(null);
      cargar();
    } catch (err) {
      setErrorModal(traducirMsg(err.response?.data?.mensaje) || t.errorResolver);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEntregado() {
    setProcesando(true);
    try {
      const { data } = await api.put(`/reportes/reembolsos/${entregando.reembolsoId}/entregar`);
      setAviso({ ok: true, texto: traducirMsg(data.mensaje) });
      setEntregando(null);
      cargar();
    } catch (err) {
      setAviso({ ok: false, texto: traducirMsg(err.response?.data?.mensaje) || t.errorEntregar });
      setEntregando(null);
    } finally {
      setProcesando(false);
    }
  }

  const metodo = (m) => tr.clientes.metodos[m] || m || "—";

  function lineaReembolso(c) {
    if (!c.reembolsoId) return { texto: t.sinReembolsoHasta(fecha(c.fechaFin, esIngles)), color: "text-[var(--c-texto-sec)]" };
    if (c.estadoReembolso === "PENDIENTE") {
      const atrasado = c.fechaLimite && String(c.fechaLimite).slice(0, 10) < hoyLocal();
      const f = atrasado ? t.reembolsoAtrasado : t.reembolsoPendiente;
      return {
        texto: f(dinero(c.reembolso), metodo(c.metodoReembolso), fecha(c.fechaLimite, esIngles)),
        color: atrasado ? "text-[var(--c-rojo)]" : "text-[var(--c-ambar-texto)]",
        pendiente: true,
      };
    }
    return {
      texto: t.reembolsoEntregado(dinero(c.reembolso), metodo(c.metodoReembolso), fecha(c.entregadoEn, esIngles)),
      color: "text-[var(--c-verde)]",
    };
  }

  const columnas = [
    { key: "periodo", label: tr.reportes.colPeriodo, render: (f) => formatearPeriodo(f.periodo) },
    { key: "servicio", label: tr.reportes.colServicio, render: (f) => `$${f.servicio}` },
    { key: "asesorias", label: tr.reportes.colAsesorias, render: (f) => `$${f.asesorias}` },
    { key: "gastos", label: tr.reportes.colGastos, render: (f) => `$${f.gastos}` },
    { key: "total", label: tr.reportes.colTotal, render: (f) => `$${f.total}` },
  ];

  const s = resolviendo?.solicitud;

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--c-texto)] mb-6">{tr.reportes.titulo}</h1>

      {aviso && (
        <p className={`text-sm mb-4 ${aviso.ok ? "text-[var(--c-verde)]" : "text-[var(--c-rojo)]"}`}>{aviso.texto}</p>
      )}

      {/* Solicitudes por autorizar: van primero porque requieren acción */}
      <h2 className="text-base font-semibold text-[var(--c-texto)] mb-3">{t.solicitudes(solicitudes.length)}</h2>
      {solicitudes.length === 0 ? (
        <p className="text-sm text-[var(--c-texto-tenue)] mb-8">{t.sinSolicitudes}</p>
      ) : (
        <div className="space-y-3 mb-8">
          {solicitudes.map((sol) => (
            <div key={sol.id} className={tarjetaClase}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--c-texto)]">
                    {sol.cliente} <span className="text-xs text-[var(--c-texto-tenue)]">{sol.numeroMembresia}</span>
                  </p>
                  <p className="text-xs text-[var(--c-texto-sec)] mt-0.5">
                    {t.solicitudMeta(fecha(sol.solicitadaEn, esIngles), sol.solicito || "—", t.tipos[sol.tipo] || sol.tipo)}
                  </p>
                  <p className="text-sm text-[var(--c-texto)] mt-1">{t.motivo(sol.motivo)}</p>
                </div>
                <div className="flex gap-2">
                  <Boton tamano="sm" variante="exito" onClick={() => abrirResolver(sol, true)}>
                    {t.autorizar}
                  </Boton>
                  <Boton tamano="sm" variante="peligro" onClick={() => abrirResolver(sol, false)}>
                    {t.rechazar}
                  </Boton>
                </div>
              </div>
              <div className="mt-3">
                <ResultadoPolitica evaluacion={sol} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-base font-semibold text-[var(--c-texto)] mb-3">{t.ingresos}</h2>
      <div className="mb-8">
        <Table columnas={columnas} filas={reportes} />
      </div>

      <h2 className="text-base font-semibold text-[var(--c-texto)] mb-3">{t.cancelaciones}</h2>
      {cancelaciones.length === 0 ? (
        <p className="text-sm text-[var(--c-texto-tenue)]">{t.sinCancelaciones}</p>
      ) : (
        <div className="space-y-3">
          {cancelaciones.map((c) => {
            const r = lineaReembolso(c);
            return (
              <div key={c.id} className={tarjetaClase}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--c-texto)]">
                      {c.cliente} <span className="text-xs text-[var(--c-texto-tenue)]">{c.numeroMembresia}</span>
                    </p>
                    <p className="text-xs text-[var(--c-texto-sec)] mt-0.5">
                      {t.cancelMeta(fecha(c.canceladaEn, esIngles), c.detalle || "—", c.autorizo || "—")}
                    </p>
                    {c.motivo && <p className="text-sm text-[var(--c-texto)] mt-1">{t.motivo(c.motivo)}</p>}
                    <p className={`text-sm font-medium mt-1 ${r.color}`}>{r.texto}</p>
                  </div>
                  {r.pendiente && (
                    <Boton tamano="sm" variante="outline" onClick={() => setEntregando(c)}>
                      {t.marcarEntregado}
                    </Boton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        abierto={Boolean(resolviendo)}
        titulo={s ? (resolviendo.autorizar ? t.autorizarTitulo(s.cliente) : t.rechazarTitulo(s.cliente)) : ""}
        onClose={() => !procesando && setResolviendo(null)}
      >
        {s && (
          <>
            <p className="text-sm text-[var(--c-texto-sec)] mb-4">
              {resolviendo.autorizar
                ? s.reembolso > 0
                  ? t.autorizarConReembolso
                  : t.autorizarSinReembolso
                : t.rechazarTexto}
            </p>
            {resolviendo.autorizar && (
              <div className="mb-4">
                <ResultadoPolitica evaluacion={s} />
              </div>
            )}
            {!resolviendo.autorizar && (
              <label className="block mb-3">
                <span className="block text-sm font-medium text-[var(--c-texto-sec)] mb-1">{t.motivoRechazo}</span>
                <textarea
                  rows={3}
                  maxLength={300}
                  className={campoClase}
                  value={nota}
                  onChange={(e) => {
                    setNota(e.target.value);
                    setErrorModal("");
                  }}
                />
              </label>
            )}
            {errorModal && <p className="text-xs text-[var(--c-rojo)] mb-3">{errorModal}</p>}
            <div className="flex items-center justify-center gap-3">
              <Boton variante="outline" className="flex-1" disabled={procesando} onClick={() => setResolviendo(null)}>
                {tr.cancelar}
              </Boton>
              <Boton
                variante={resolviendo.autorizar ? "exito" : "peligro"}
                className="flex-1"
                disabled={procesando}
                onClick={resolver}
              >
                {resolviendo.autorizar ? t.autorizar : t.rechazar}
              </Boton>
            </div>
          </>
        )}
      </Modal>

      <Modal
        abierto={Boolean(entregando)}
        titulo={t.confirmarEntregadoTitulo}
        onClose={() => !procesando && setEntregando(null)}
      >
        {entregando && (
          <>
            <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
              {t.confirmarEntregado(entregando.cliente, dinero(entregando.reembolso), metodo(entregando.metodoReembolso))}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Boton variante="outline" className="flex-1" disabled={procesando} onClick={() => setEntregando(null)}>
                {tr.cancelar}
              </Boton>
              <Boton variante="exito" className="flex-1" disabled={procesando} onClick={confirmarEntregado}>
                {t.marcarEntregado}
              </Boton>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
