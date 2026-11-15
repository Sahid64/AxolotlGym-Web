// Recuadro con lo que aplica según la política de cancelación (lo calcula la base):
// verde con reembolso, rojo sin reembolso. Lo usan Recepción (al solicitar) y el Encargado (al autorizar).
import { useIdioma } from "../../context/IdiomaContext.jsx";
import { dinero, fecha } from "../../utils/formato.js";

export default function ResultadoPolitica({ evaluacion: e }) {
  const { tr, esIngles } = useIdioma();
  const t = tr.cancelacion;
  if (!e) return null;
  const conReembolso = Number(e.reembolso || 0) > 0;
  const regla = t.reglas[e.regla] || t.reglas.SIN_PAGO;
  const metodo = tr.clientes.metodos[e.metodo] || e.metodo || "—";

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        conReembolso
          ? "border-[var(--c-verde)] bg-[var(--c-verde-bg)]"
          : "border-[var(--c-rojo)] bg-[var(--c-rojo-10)]"
      }`}
    >
      <p className={`font-semibold ${conReembolso ? "text-[var(--c-verde-texto)]" : "text-[var(--c-rojo)]"}`}>
        {conReembolso ? t.reembolsoCompleto(dinero(e.reembolso), metodo) : t.sinReembolso}
      </p>
      <p className="text-[var(--c-texto)] mt-1">{regla(Math.floor(e.horas || 0))}</p>
      <p className="text-[var(--c-texto-sec)] mt-1">
        {conReembolso ? t.plazoReembolso(fecha(e.fechaLimite, esIngles)) : t.vigenteHasta(fecha(e.fechaFin, esIngles))}
      </p>
      {conReembolso && <p className="text-xs text-[var(--c-texto-sec)] mt-1">{t.notaAcceso}</p>}
    </div>
  );
}
