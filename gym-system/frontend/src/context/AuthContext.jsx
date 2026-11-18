import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api.js";
import {
  CLAVE_TOKEN, CLAVE_USUARIO, esRutaProtegida, irALogin, leerUsuario, limpiarSesion,
  mostrarPagina, ocultarPagina, sesionVigente,
} from "./sesion.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (sesionVigente() ? leerUsuario() : null));

  // Guardia contra la bfcache y el historial: cada vez que la página vuelve a mostrarse
  // (botón Atrás/Adelante, otra pestaña cerró sesión, pestaña que regresa al frente)
  // se revisa la sesión en localStorage. Si ya no hay sesión y se está en una sección
  // privada, se sale a /login sin mostrar el contenido.
  useEffect(() => {
    function revisar() {
      if (sesionVigente()) return true;
      setUsuario(null);
      if (esRutaProtegida()) {
        irALogin();
        return false;
      }
      return true;
    }

    // Al guardarse en la bfcache, la copia de una sección privada se guarda oculta;
    // así, al volver con "Atrás", no se ve ni un instante antes de revisar la sesión.
    const alOcultar = (e) => {
      if (e.persisted && esRutaProtegida()) ocultarPagina();
    };
    const alMostrar = (e) => {
      if (e.persisted) {
        ocultarPagina();
        if (!revisar()) return;
      }
      mostrarPagina();
    };
    const alCambiarHistorial = () => revisar();
    const alVolverAlFrente = () => {
      if (!document.hidden) revisar();
    };
    // Otra pestaña inició o cerró sesión
    const alCambiarStorage = (e) => {
      if (e.key === null || e.key === CLAVE_TOKEN || e.key === CLAVE_USUARIO) {
        if (revisar()) setUsuario(sesionVigente() ? leerUsuario() : null);
      }
    };

    window.addEventListener("pagehide", alOcultar);
    window.addEventListener("pageshow", alMostrar);
    window.addEventListener("popstate", alCambiarHistorial);
    window.addEventListener("storage", alCambiarStorage);
    document.addEventListener("visibilitychange", alVolverAlFrente);
    return () => {
      window.removeEventListener("pagehide", alOcultar);
      window.removeEventListener("pageshow", alMostrar);
      window.removeEventListener("popstate", alCambiarHistorial);
      window.removeEventListener("storage", alCambiarStorage);
      document.removeEventListener("visibilitychange", alVolverAlFrente);
    };
  }, []);

  async function login(correo, password) {
    const { data } = await api.post("/auth/login", { correo, password });
    localStorage.setItem(CLAVE_TOKEN, data.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  // Cierre de sesión limpio: primero se borra todo (storage y estado) y luego se va a /login
  // reemplazando la entrada del historial, con recarga completa para no dejar nada en memoria
  // (listas, fotos, datos de salud) que la bfcache pudiera restaurar.
  function logout() {
    limpiarSesion();
    setUsuario(null);
    irALogin();
  }

  // Sesión que venció o se borró mientras la página seguía abierta: limpia sin recargar
  function terminarSesion() {
    limpiarSesion();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, terminarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
