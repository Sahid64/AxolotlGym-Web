import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useIdioma } from "../context/IdiomaContext.jsx";
import BotonTema from "../components/ui/BotonTema.jsx";
import BotonIdioma from "../components/ui/BotonIdioma.jsx";
import FondoGym from "../components/ui/FondoGym.jsx";

const APK_URL = "https://github.com/itsbuglover/AxolotlGym-Web/releases/latest/download/AxolotlGym.apk";

// Las imágenes traen texto dentro. Versión en inglés: /images/img11.png, img22.png ... img66.png
// (si no existe el .png se prueba .jpg, y si tampoco, se usa la versión en español)
const EXT_INGLES = ["png", "jpg", "jpeg", "webp"];
const NUM_IMAGENES = 6;
const IMAGENES = Array.from({ length: NUM_IMAGENES }, (_, i) => i + 1);

const ICONOS_CARACT = [
  // Rostro / escaneo
  <path key="a" d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 10v1M15 10v1M9.5 15c.7.7 1.6 1 2.5 1s1.8-.3 2.5-1" />,
  // Tarjeta de pago
  <path key="b" d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h3" />,
  // Panel
  <path key="c" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
];

function BotonDescarga({ className = "" }) {
  const { tr } = useIdioma();
  return (
    <a
      href={APK_URL}
      download
      className={`group relative inline-flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--c-acento-60)] px-6 py-3.5 text-[var(--c-sobre-acento)] shadow-[0_8px_30px_var(--c-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_var(--c-acento-60)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-acento-texto)] ${className}`}
      style={{ background: "linear-gradient(135deg, var(--c-acento-texto), var(--c-acento) 55%, var(--c-bronce))" }}
    >
      {/* Brillo que cruza al pasar el cursor */}
      <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/30 opacity-0 blur-md transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />

      {/* Icono Android */}
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="relative shrink-0" aria-hidden="true">
        <path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.4 11.4 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
      </svg>

      <span className="relative text-left leading-tight">
        <span className="block text-sm font-bold sm:text-base">{tr.inicio.descargarApp}</span>
        <span className="block text-[11px] font-medium opacity-75">{tr.inicio.descargarSub}</span>
      </span>

      {/* Icono descarga */}
      <span className="relative ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/20 transition-transform duration-300 group-hover:translate-y-0.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
        </svg>
      </span>
    </a>
  );
}

export default function Inicio() {
  const { tr, idioma } = useIdioma();
  const t = tr.inicio;
  const [activa, setActiva] = useState(0);
  // Intento de extensión por imagen en inglés; si se agotan, se usa la versión en español
  const [intento, setIntento] = useState({});
  const sinIngles = (n) => (intento[n] || 0) >= EXT_INGLES.length;

  useEffect(() => {
    const id = window.setInterval(() => setActiva((a) => (a + 1) % IMAGENES.length), 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--c-fondo)] text-[var(--c-texto)]">
      <FondoGym />

      {/* Barra superior: idioma, tema e inicio de sesión (esquina superior derecha) */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <img src="/logo_final.png" alt="Axolotl" className="h-9 w-9 object-contain" />
          <span className="hidden text-sm font-bold tracking-[0.3em] sm:block">AXOLOTL</span>
        </div>

        <div className="flex items-center gap-2">
          <BotonIdioma />
          <BotonTema />
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-[var(--c-bronce)] px-4 py-2 text-xs font-semibold text-[var(--c-sobre-acento)] transition-colors hover:bg-[var(--c-acento)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            {t.iniciarSesion}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center px-5 pb-16 pt-28 text-center">
        <img
          src="/logo_final.png"
          alt="Axolotl"
          className="h-28 w-28 object-contain sm:h-36 sm:w-36"
          style={{ filter: "drop-shadow(0 0 24px var(--c-acento-60))" }}
        />
        <p className="mt-4 text-xs font-semibold tracking-[0.35em] text-[var(--c-acento-texto)]">{t.insignia}</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">{t.titulo}</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--c-texto-sec)] sm:text-base">{t.descripcion}</p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <BotonDescarga />
        </div>

        {/* Carrusel */}
        <section className="mt-14 w-full" aria-label="Galería">
          <div className="fx-borde relative mx-auto w-full max-w-3xl">
            <div className="relative aspect-video overflow-hidden rounded-[calc(1rem-1.5px)] bg-black">
              {IMAGENES.map((n, i) => {
                const usaIngles = idioma === "en" && !sinIngles(n);
                return (
                  <img
                    key={`${idioma}-${n}-${usaIngles ? intento[n] || 0 : "es"}`}
                    src={usaIngles ? `/images/img${n}${n}.${EXT_INGLES[intento[n] || 0]}` : `/images/img${n}.png`}
                    alt={t.carrusel[i]}
                    onError={() => usaIngles && setIntento((p) => ({ ...p, [n]: (p[n] || 0) + 1 }))}
                    className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ${
                      i === activa ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  />
                );
              })}
              {/* Pie en inglés solo si la imagen aún está en español */}
              {idioma === "en" && sinIngles(IMAGENES[activa]) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-4 pt-12 text-left">
                  <p className="text-sm font-semibold text-white sm:text-base">{t.carrusel[activa]}</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            {IMAGENES.map((n, i) => (
              <button
                key={n}
                type="button"
                onClick={() => setActiva(i)}
                aria-label={`${t.verImagen} ${i + 1}`}
                aria-current={i === activa}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === activa ? "w-10 bg-[var(--c-acento-texto)]" : "w-4 bg-[var(--c-borde)] hover:bg-[var(--c-acento)]"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Características */}
        <section className="mt-14 grid w-full gap-4 sm:grid-cols-3">
          {t.caracteristicas.map((c, i) => (
            <div key={c.titulo} className="fx-cristal rounded-2xl p-5 text-left">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[var(--c-acento-15)] text-[var(--c-acento-texto)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ICONOS_CARACT[i]}
                </svg>
              </div>
              <h3 className="text-sm font-bold">{c.titulo}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--c-texto-sec)]">{c.texto}</p>
            </div>
          ))}
        </section>

        {/* Pie */}
        <footer className="mt-14 flex flex-col items-center gap-2 text-xs text-[var(--c-texto-tenue)]">
          <div className="flex gap-4">
            <Link to="/terminos" className="hover:text-[var(--c-acento-texto)] hover:underline">{tr.login.terminosLink}</Link>
            <Link to="/privacidad" className="hover:text-[var(--c-acento-texto)] hover:underline">{tr.login.privacidadLink}</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
