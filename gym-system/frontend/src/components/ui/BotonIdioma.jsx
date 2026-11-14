import { useIdioma } from "../../context/IdiomaContext.jsx";

export default function BotonIdioma({ className = "" }) {
  const { idioma, alternarIdioma, tr } = useIdioma();

  return (
    <button
      type="button"
      onClick={alternarIdioma}
      aria-label={tr.etiquetaIdioma}
      title={tr.etiquetaIdioma}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--c-borde)] bg-[var(--c-tarjeta)] text-xs font-bold text-[var(--c-texto)] hover:border-[var(--c-acento)] hover:bg-[var(--c-borde-20)] transition-colors ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[var(--c-acento)]"
      >
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
      </svg>
      <span>{tr.etiquetaIdioma}</span>
      <span className="px-1.5 py-0.5 rounded-full border border-[var(--c-acento)] bg-[var(--c-acento-15)] text-[10px] font-bold text-[var(--c-acento)]">
        {idioma === "es" ? "ES" : "EN"}
      </span>
    </button>
  );
}
