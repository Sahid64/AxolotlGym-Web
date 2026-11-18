import { useLayoutEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { sesionVigente } from "../../context/sesion.js";
import Shell from "./Shell.jsx";

// Sesión ausente o vencida: limpia el estado y manda a /login sin pintar nada privado
function SesionTerminada() {
  const { usuario, terminarSesion } = useAuth();
  useLayoutEffect(() => {
    if (usuario) terminarSesion();
  }, [usuario]);
  return <Navigate to="/login" replace />;
}

// rolesPermitidos: array de roles que pueden entrar a esta seccion
export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario } = useAuth();

  // Se revisa en cada render contra localStorage (no solo el estado de React), así una página
  // restaurada del historial o con el token borrado/vencido no muestra el contenido privado.
  if (!usuario || !sesionVigente()) return <SesionTerminada />;
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/login" replace />;
  }
  return <Shell>{children}</Shell>;
}
