import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// La página de inicio va en el bundle principal (es la de entrada); las demás se cargan
// por ruta: cada sección baja su propio JS solo cuando se visita.
import Inicio from "../pages/Inicio.jsx";
const Login = lazy(() => import("../pages/Login.jsx"));
const Terminos = lazy(() => import("../pages/Terminos.jsx"));
const Privacidad = lazy(() => import("../pages/Privacidad.jsx"));

import RutaProtegida from "../components/layout/RutaProtegida.jsx";

// Recepcion
const AccesoFacial = lazy(() => import("../pages/recepcion/AccesoFacial.jsx")); // toma de lista con reconocimiento facial
const Clientes = lazy(() => import("../pages/recepcion/Clientes.jsx"));
const Solicitudes = lazy(() => import("../pages/recepcion/Solicitudes.jsx"));
const PagosRecepcion = lazy(() => import("../pages/recepcion/Pagos.jsx"));

// Encargado / Dueño
const Dashboard = lazy(() => import("../pages/encargado/Dashboard.jsx"));
const Personal = lazy(() => import("../pages/encargado/Personal.jsx")); // recepcion, instructores, encargados
const Servicios = lazy(() => import("../pages/encargado/Servicios.jsx"));
const Gastos = lazy(() => import("../pages/encargado/Gastos.jsx"));
const Reportes = lazy(() => import("../pages/encargado/Reportes.jsx"));
const PagosEncargado = lazy(() => import("../pages/encargado/Pagos.jsx"));
const Avisos = lazy(() => import("../pages/encargado/Avisos.jsx")); // comunicados por correo
const Movimientos = lazy(() => import("../pages/encargado/Movimientos.jsx")); // bitácora de movimientos por rol

// Compartidas por Recepcion y Encargado (igual que la app)
const Visitas = lazy(() => import("../pages/compartidas/Visitas.jsx")); // pase de un dia
const Perfil = lazy(() => import("../pages/compartidas/Perfil.jsx"));

export default function AppRoutes() {
  return (
    // Las secciones protegidas tienen su propio Suspense dentro de Shell (la barra lateral no parpadea)
    <Suspense fallback={null}>
    <Routes>
      {/* Página publicitaria */}
      <Route path="/" element={<Inicio />} />

      {/* Login y Páginas Legales */}
      <Route path="/login" element={<Login />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/privacidad" element={<Privacidad />} />

      {/* Recepcion */}
      <Route
        path="/recepcion"
        element={
          <RutaProtegida rolesPermitidos={["recepcion"]}>
            <AccesoFacial />
          </RutaProtegida>
        }
      />

      <Route
        path="/recepcion/clientes"
        element={
          <RutaProtegida rolesPermitidos={["recepcion"]}>
            <Clientes />
          </RutaProtegida>
        }
      />

      <Route
        path="/recepcion/solicitudes"
        element={
          <RutaProtegida rolesPermitidos={["recepcion"]}>
            <Solicitudes />
          </RutaProtegida>
        }
      />

      <Route
        path="/recepcion/pagos"
        element={
          <RutaProtegida rolesPermitidos={["recepcion"]}>
            <PagosRecepcion />
          </RutaProtegida>
        }
      />

      {/* Encargado / Dueño */}
      <Route
        path="/encargado"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Dashboard />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/clientes"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Clientes />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/personal"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Personal />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/servicios"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Servicios />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/gastos"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Gastos />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/pagos"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <PagosEncargado />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/reportes"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Reportes />
          </RutaProtegida>
        }
      />

      <Route
        path="/recepcion/visitas"
        element={
          <RutaProtegida rolesPermitidos={["recepcion"]}>
            <Visitas />
          </RutaProtegida>
        }
      />

      <Route
        path="/recepcion/perfil"
        element={
          <RutaProtegida rolesPermitidos={["recepcion"]}>
            <Perfil />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/visitas"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Visitas />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/avisos"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Avisos />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/movimientos"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Movimientos />
          </RutaProtegida>
        }
      />

      <Route
        path="/encargado/perfil"
        element={
          <RutaProtegida rolesPermitidos={["encargado", "dueno"]}>
            <Perfil />
          </RutaProtegida>
        }
      />

      {/* Rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
