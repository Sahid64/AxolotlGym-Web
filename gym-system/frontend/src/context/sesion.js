// Utilidades de sesión sin dependencias (las usan AuthContext, RutaProtegida y api.js).
// La sesión es el JWT que firma el backend (/auth/login), guardado en localStorage.
// No se usa Supabase Auth en el navegador, así que no hay signOut de Supabase que llamar.

export const CLAVE_TOKEN = "gym_token";
export const CLAVE_USUARIO = "gym_usuario";

// Secciones privadas (todo lo que pasa por RutaProtegida)
export const esRutaProtegida = (ruta = window.location.pathname) => /^\/(recepcion|encargado)(\/|$)/.test(ruta);

// Lee el "exp" del JWT sin verificar la firma (eso lo hace el backend en cada petición).
// Sirve para no mostrar una pantalla privada con un token ya vencido.
function tokenVigente(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64));
    return typeof exp !== "number" || exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function leerUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO) || "null");
  } catch {
    return null;
  }
}

// Hay sesión solo si existen el token (no vencido) y el usuario guardado
export function sesionVigente() {
  let token = null;
  try {
    token = localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return false;
  }
  return Boolean(token && tokenVigente(token) && leerUsuario());
}

// Borra todo rastro de la sesión. El tema y el idioma son preferencias del equipo y se conservan.
export function limpiarSesion() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  } catch {}
  try {
    sessionStorage.clear();
  } catch {}
}

export const ocultarPagina = () => {
  document.documentElement.style.visibility = "hidden";
};
export const mostrarPagina = () => {
  document.documentElement.style.visibility = "";
};

// Sale a /login reemplazando la entrada actual del historial (con "Atrás" no se vuelve aquí).
// Antes de salir se oculta la página para que la copia que guarde la bfcache quede en blanco.
export function irALogin() {
  limpiarSesion();
  ocultarPagina();
  window.location.replace("/login");
}
