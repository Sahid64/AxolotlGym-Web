import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { esRutaDeSuRol, leerUsuario, sesionVigente } from "../../context/sesion.js";

// Regla estricta: la sesión solo vive dentro del panel del rol del usuario.
// Si un usuario con sesión activa aterriza en cualquier otra ruta, sea por el botón Atrás
// (popstate hacia /login o /), una URL escrita a mano o un enlace, la sesión se destruye
// en ese momento y se va a /login reemplazando el historial. Así, al presionar
// "Adelante" ya no hay sesión y RutaProtegida / pageshow lo mantienen en /login.
//
// Solo reacciona a CAMBIOS DE UBICACIÓN (no al iniciar sesión): en /login, login() guarda la
// sesión sin cambiar de ruta, y el navigate("/encargado") que sigue ya cae dentro del panel.
// Moverse entre pantallas del propio panel (adelante o atrás) no cierra la sesión.
export default function GuardiaSesion() {
  const { pathname, key } = useLocation();
  const { logout } = useAuth();

  // useLayoutEffect: se ejecuta antes de pintar, así /login o / no llegan a verse con sesión
  useLayoutEffect(() => {
    if (!sesionVigente()) return;
    if (esRutaDeSuRol(pathname, leerUsuario()?.rol)) return;
    logout(); // limpia storage + estado y hace location.replace("/login")
  }, [pathname, key]);

  return null;
}
