import axios from "axios";
import { CLAVE_TOKEN, irALogin, limpiarSesion } from "../context/sesion.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// Adjunta el token guardado en cada peticion
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira/es invalido, se limpia la sesión y se regresa al login REEMPLAZANDO
// la entrada del historial (antes era location.href: la página privada quedaba detrás de "Atrás").
// En las rutas públicas de /auth (login, recuperar contraseña) un 401 es "contraseña incorrecta":
// no se recarga, así el formulario conserva su mensaje de error.
const RUTAS_PUBLICAS = /^\/auth\/(login|login-cliente|recuperar\/)/;
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const esPublica = RUTAS_PUBLICAS.test(String(err.config?.url || ""));
    if (err.response?.status === 401 && !esPublica) {
      if (window.location.pathname === "/login") limpiarSesion();
      else irALogin();
    }
    return Promise.reject(err);
  }
);

export default api;
