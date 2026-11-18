import { Suspense } from "react";
import Sidebar from "./Sidebar.jsx";

export default function Shell({ children }) {
  return (
    <div className="flex h-screen bg-[var(--c-fondo)] text-[var(--c-texto)]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto px-5 py-6">
        {/* Mientras llega el JS de la sección solo se espera aquí; la barra lateral queda fija */}
        <Suspense fallback={<p className="p-6 text-sm text-[var(--c-texto-tenue)]">…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}