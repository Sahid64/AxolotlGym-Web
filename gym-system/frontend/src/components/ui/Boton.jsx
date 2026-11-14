export default function Boton({ children, variante = "primary", tamano = "md", className = "", ...props }) {
  const variantes = {
    primary: "bg-[var(--c-bronce)] hover:bg-[var(--c-acento)] text-[var(--c-sobre-acento)] border border-transparent",
    outline: "border border-[var(--c-acento)] text-[var(--c-acento)] hover:bg-[var(--c-acento-10)]",
    ghost: "text-[var(--c-texto-sec)] hover:bg-[var(--c-borde-20)] border border-transparent",
    exito: "bg-[var(--c-verde)] hover:brightness-90 text-white border border-transparent",
    peligro: "bg-[var(--c-rojo)] hover:brightness-90 text-white border border-transparent",
  };
  const tamanos = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
  };
  return (
    <button
      className={`inline-flex items-center justify-center text-center whitespace-nowrap font-medium transition-colors disabled:opacity-50 ${tamanos[tamano] || tamanos.md} ${variantes[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
