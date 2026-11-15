// Recepción (o el Encargado) registra la solicitud de cancelación; el Encargado la autoriza
// después desde Reportes. Antes de enviarla se muestra lo que aplica según la política
// (lo calcula la base). La membresía sigue activa mientras la solicitud está pendiente.
import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Modal from "../ui/Modal.jsx";
import Boton from "../ui/Boton.jsx";
import ResultadoPolitica from "./ResultadoPolitica.jsx";
import { campoClase } from "../../utils/formato.js";

export default function CancelarMembresia({ cliente, nombre, onCerrar, onListo }) {
  const { tr, traducirMsg } = useIdioma();
  const t = tr.cancelacion;
  const [tipo, setTipo] = useState("VOLUNTARIA");
  const [evaluacion, setEvaluacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Cada vez que cambia el tipo se vuelve a calcular la política (vista previa, no cambia nada)
  useEffect(() => {
    if (!cliente) return;
    let vigente = true;
    setCargando(true);
    setEvaluacion(null);
    setError("");
    api
      .get(`/clientes/${cliente.id}/cancelacion`, { params: { tipo } })
      .then(({ data }) => vigente && setEvaluacion(data.evaluacion))
      .catch((err) => vigente && setError(traducirMsg(err.response?.data?.mensaje) || t.error))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [cliente?.id, tipo]);

  const listo = evaluacion && !enviando && motivo.trim().length >= 3;

  async function enviar() {
    setEnviando(true);
    setError("");
    try {
      await api.post(`/clientes/${cliente.id}/cancelacion`, { tipo, motivo: motivo.trim() });
      onListo(t.enviada(nombre));
    } catch (err) {
      setError(traducirMsg(err.response?.data?.mensaje) || t.error);
      setEnviando(false);
    }
  }

  return (
    <Modal abierto={Boolean(cliente)} titulo={t.titulo(nombre)} onClose={() => !enviando && onCerrar()}>
      <div className="space-y-2 mb-4">
        {[
          ["VOLUNTARIA", t.voluntaria],
          ["ERROR_COBRO", t.errorCobro],
        ].map(([valor, etiqueta]) => (
          <label key={valor} className="flex items-center gap-2 text-sm text-[var(--c-texto)] cursor-pointer">
            <input
              type="radio"
              name="tipoCancelacion"
              checked={tipo === valor}
              disabled={enviando}
              onChange={() => setTipo(valor)}
              className="accent-[var(--c-acento)]"
            />
            {etiqueta}
          </label>
        ))}
      </div>

      <div className="mb-4">
        {cargando ? (
          <p className="text-sm text-[var(--c-texto-sec)]">{t.revisando}</p>
        ) : (
          <ResultadoPolitica evaluacion={evaluacion} />
        )}
      </div>

      <label className="block mb-3">
        <span className="block text-sm font-medium text-[var(--c-texto-sec)] mb-1">{t.motivo}</span>
        <textarea
          rows={3}
          maxLength={300}
          disabled={enviando}
          className={campoClase}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </label>
      {motivo && motivo.trim().length < 3 && <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{t.motivoMin}</p>}

      <p className="text-xs text-[var(--c-texto-tenue)] mb-4">{t.notaPendiente}</p>
      {error && <p className="text-sm text-[var(--c-rojo)] mb-3">{error}</p>}

      <div className="flex items-center justify-center gap-3">
        <Boton variante="outline" className="flex-1" disabled={enviando} onClick={onCerrar}>
          {tr.cancelar}
        </Boton>
        <Boton variante="peligro" className="flex-1" disabled={!listo} onClick={enviar}>
          {t.enviar}
        </Boton>
      </div>
    </Modal>
  );
}
