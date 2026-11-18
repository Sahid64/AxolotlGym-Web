import { useEffect, useRef } from "react";

// Pila de modales abiertos: Esc solo cierra el de hasta arriba
// (por ejemplo, la confirmación que está encima del formulario).
const pila = [];

/**
 * Ventana modal.
 * - La barra del título (con la X) se queda fija arriba aunque el contenido haga scroll.
 * - Esc cierra el modal de hasta arriba.
 * - cerrarAlClicFuera: también se cierra al hacer clic en el fondo oscuro.
 * onClose decide qué pasa (por ejemplo, preguntar si se descartan los cambios).
 */
export default function Modal({ abierto, titulo, onClose, children, cerrarAlClicFuera = false }) {
  const idRef = useRef(Symbol("modal"));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!abierto) return;
    const id = idRef.current;
    pila.push(id);
    const alPresionar = (e) => {
      if (e.key === "Escape" && pila[pila.length - 1] === id) {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => {
      window.removeEventListener("keydown", alPresionar);
      const i = pila.lastIndexOf(id);
      if (i !== -1) pila.splice(i, 1);
    };
  }, [abierto]);

  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (cerrarAlClicFuera && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[var(--c-tarjeta)] border border-[var(--c-borde)] rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-borde-suave)] shrink-0">
          <h3 className="font-semibold text-[var(--c-texto)]">{titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[var(--c-texto-sec)] hover:text-[var(--c-acento)] text-2xl leading-none px-1"
          >
            &times;
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
