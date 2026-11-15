// Utilidades de formato compartidas por las páginas nuevas

export const dinero = (n) =>
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// "2026-11-18" o ISO completo -> "18 nov 2026" / "Nov 18, 2026"
export function fecha(iso, esIngles) {
  if (!iso) return "—";
  const s = String(iso);
  // Las fechas sin hora se leen como locales para que no se recorran un día
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(esIngles ? "en-US" : "es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// Fecha de hoy en hora local (YYYY-MM-DD)
export const hoyLocal = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Suma días a una fecha YYYY-MM-DD
export function sumarDias(isoFecha, dias) {
  const d = new Date(`${isoFecha}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Días entre dos fechas YYYY-MM-DD
export const diasEntre = (a, b) =>
  Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);

export const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
export const limpiarLetras = (v) =>
  v.replace(new RegExp(`[^${LETRAS} ]`, "g"), "").replace(/^\s+/, "").replace(/\s{2,}/g, " ").slice(0, 60);
export const limpiarTelefono = (v) => v.replace(/\D/g, "").slice(0, 10);
export const contarLetras = (v) => (String(v || "").match(new RegExp(`[${LETRAS}]`, "g")) || []).length;

export const campoClase =
  "w-full bg-[var(--c-campo)] border border-[var(--c-borde)] rounded-md px-3 py-2 text-sm text-[var(--c-texto)] " +
  "placeholder:text-[var(--c-texto-tenue)] focus:outline-none focus:border-[var(--c-acento)] focus:ring-1 focus:ring-[var(--c-acento)]";

export const tarjetaClase = "bg-[var(--c-tarjeta)] border border-[var(--c-borde)] rounded-lg p-5";
