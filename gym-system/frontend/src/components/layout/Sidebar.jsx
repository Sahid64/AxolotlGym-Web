import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../api/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import BotonTema from "../ui/BotonTema.jsx";
import Boton from "../ui/Boton.jsx";
import Modal from "../ui/Modal.jsx";

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const { alternarIdioma, tr } = useIdioma();
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [miFoto, setMiFoto] = useState(null);

  useEffect(() => {
    if (!usuario?.correo) return;
    api
      .get("/auth/mi-foto")
      .then(({ data }) => setMiFoto(data?.foto || null))
      .catch(() => setMiFoto(null));
  }, [usuario?.correo]);

  const menuPorRol = {
    recepcion: [
      { to: "/recepcion", label: tr.menu.accesoFacial, fin: true },
      { to: "/recepcion/clientes", label: tr.menu.clientes },
      { to: "/recepcion/visitas", label: tr.menuExtra.visitas },
      { to: "/recepcion/solicitudes", label: tr.menu.solicitudes },
      { to: "/recepcion/pagos", label: tr.menu.pagos },
      { to: "/recepcion/perfil", label: tr.menuExtra.perfil },
    ],
    encargado: [
      { to: "/encargado", label: tr.menu.dashboard, fin: true },
      { to: "/encargado/clientes", label: tr.menu.clientes },
      { to: "/encargado/personal", label: tr.menu.personal },
      { to: "/encargado/servicios", label: tr.menu.servicios },
      { to: "/encargado/gastos", label: tr.menu.gastos },
      { to: "/encargado/pagos", label: tr.menu.pagos },
      { to: "/encargado/visitas", label: tr.menuExtra.visitas },
      { to: "/encargado/reportes", label: tr.menu.reportes },
      { to: "/encargado/avisos", label: tr.menuExtra.avisos },
      { to: "/encargado/movimientos", label: tr.menuExtra.movimientos },
      { to: "/encargado/perfil", label: tr.menuExtra.perfil },
    ],
    dueno: [
      { to: "/encargado", label: tr.menu.dashboard, fin: true },
      { to: "/encargado/clientes", label: tr.menu.clientes },
      { to: "/encargado/personal", label: tr.menu.personal },
      { to: "/encargado/servicios", label: tr.menu.servicios },
      { to: "/encargado/gastos", label: tr.menu.gastos },
      { to: "/encargado/pagos", label: tr.menu.pagos },
      { to: "/encargado/visitas", label: tr.menuExtra.visitas },
      { to: "/encargado/reportes", label: tr.menu.reportes },
      { to: "/encargado/avisos", label: tr.menuExtra.avisos },
      { to: "/encargado/movimientos", label: tr.menuExtra.movimientos },
      { to: "/encargado/perfil", label: tr.menuExtra.perfil },
    ],
  };

  const items = menuPorRol[usuario?.rol] || [];
  const inicial = (usuario?.nombre || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="flex h-full shrink-0 overflow-hidden">
        <aside className="w-56 h-full bg-[var(--c-barra)] flex flex-col justify-between overflow-hidden">
          {/* Encabezado compacto: logo, nombre y rol */}
          <div className="shrink-0 px-4 pt-4 pb-3 flex flex-col items-center text-center">
            <img src="/logo_final.webp" alt="Axolotl" className="w-20 h-20 object-contain" />
            <p className="mt-2 text-base font-bold tracking-[0.3em] text-[var(--c-texto)]">AXOLOTL</p>
            <span className="mt-1.5 px-3.5 py-0.5 rounded-full border border-[var(--c-acento)] bg-[var(--c-acento-15)] text-xs font-bold text-[var(--c-acento)]">
              {tr.roles[usuario?.rol] || usuario?.rol}
            </span>
          </div>

          <div className="shrink-0 mx-5 h-[1.5px] bg-gradient-to-r from-[var(--c-borde)] to-[var(--c-acento)]" />

          {/* Navegación con scroll interno si la pantalla es baja */}
          <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.fin}
                className={({ isActive }) =>
                  `block text-center px-4 py-2.5 rounded-xl text-sm transition-colors border ${
                    isActive
                      ? "border-[var(--c-acento)] bg-gradient-to-r from-[var(--c-acento-30)] to-[var(--c-acento-5)] text-[var(--c-texto)] font-bold"
                      : "border-transparent text-[var(--c-texto-sec)] font-medium hover:bg-[var(--c-borde-20)]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Opción de Cambiar idioma con ícono de traducción */}
            <button
              type="button"
              onClick={alternarIdioma}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors border border-transparent text-[var(--c-texto-sec)] font-medium hover:bg-[var(--c-borde-20)]"
            >
              <svg
                width="17"
                height="17"
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
            </button>
          </nav>

          {/* Pie fijo: Usuario, tema y cerrar sesión */}
          <div className="shrink-0 px-4 pt-2 pb-4 border-t border-[var(--c-borde-20)]">
            <div className="flex items-center gap-3 px-2 mb-2.5">
              {miFoto ? (
                <img
                  src={miFoto}
                  alt={usuario?.nombre || ""}
                  className="w-9 h-9 shrink-0 rounded-full border border-[var(--c-acento)] object-cover bg-[var(--c-fondo)]"
                />
              ) : (
                <div className="w-9 h-9 shrink-0 rounded-full border border-[var(--c-acento)] bg-[var(--c-fondo)] flex items-center justify-center text-sm font-bold text-[var(--c-acento)]">
                  {inicial}
                </div>
              )}
              <p className="flex-1 text-sm text-[var(--c-texto)] truncate text-center font-medium">
                {usuario?.nombre}
              </p>
              <BotonTema />
            </div>
            <button
              type="button"
              onClick={() => setConfirmarSalida(true)}
              className="w-full text-center px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--c-rojo)] border border-[var(--c-rojo-70)] bg-[var(--c-rojo-10)] hover:bg-[var(--c-rojo-20)] transition-colors"
            >
              {tr.menu.cerrarSesion}
            </button>
          </div>
        </aside>

        {/* Borde derecho dorado */}
        <div className="w-[2px] h-full bg-gradient-to-b from-[var(--c-borde)] to-[var(--c-acento)]" />
      </div>

      {/* Modal de confirmación antes de cerrar sesión */}
      <Modal
        abierto={confirmarSalida}
        titulo={tr.menu.confirmarSalidaTitulo}
        onClose={() => setConfirmarSalida(false)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {tr.menu.confirmarSalidaMsg}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setConfirmarSalida(false)}>
            {tr.cancelar}
          </Boton>
          <Boton
            variante="peligro"
            className="flex-1"
            onClick={() => {
              setConfirmarSalida(false);
              logout();
            }}
          >
            {tr.menu.confirmarSalidaBtn}
          </Boton>
        </div>
      </Modal>
    </>
  );
}
