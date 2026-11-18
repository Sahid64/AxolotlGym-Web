import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { TemaProvider } from "./context/TemaContext.jsx";
import { IdiomaProvider } from "./context/IdiomaContext.jsx";
import "./index.css";

// Despierta el backend en cuanto se abre cualquier página (en el plan gratuito de Render el
// servidor se duerme tras 15 min sin uso). Así arranca mientras la persona escribe su contraseña.
const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
fetch(API.replace(/\/api\/?$/, "/"), { mode: "no-cors" }).catch(() => {});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <IdiomaProvider>
        <TemaProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </TemaProvider>
      </IdiomaProvider>
    </BrowserRouter>
  </React.StrictMode>
);