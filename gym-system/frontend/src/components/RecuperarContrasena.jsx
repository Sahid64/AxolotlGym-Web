// "Olvidé mi contraseña" (igual que la app): primero se escribe el correo y la contraseña
// nueva; se manda un código de 6 dígitos al correo y con él se confirma el cambio.
import { useEffect, useState } from "react";
import api from "../api/api.js";
import { useIdioma } from "../context/IdiomaContext.jsx";
import Modal from "./ui/Modal.jsx";
import Input from "./ui/Input.jsx";
import Boton from "./ui/Boton.jsx";

const ESPERA_REENVIO = 60; // segundos antes de poder pedir otro código

export default function RecuperarContrasena({ abierto, correoInicial = "", onCerrar }) {
  const { tr, traducirMsg } = useIdioma();
  const t = tr.recuperar;
  const [correo, setCorreo] = useState(correoInicial);
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [espera, setEspera] = useState(0);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCorreo(correoInicial);
    setNueva("");
    setRepetir("");
    setCodigo("");
    setCodigoEnviado(false);
    setError("");
    setListo(false);
  }, [abierto]);

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const coincide = nueva === repetir;
  const datosListos = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim()) && nueva.length > 0 && coincide;

  async function enviarCodigo() {
    setCargando(true);
    setError("");
    try {
      await api.post("/auth/recuperar/codigo", { correo: correo.trim(), nueva });
      setCodigoEnviado(true);
      setCodigo("");
      setEspera(ESPERA_REENVIO);
    } catch (err) {
      setError(traducirMsg(err.response?.data?.mensaje) || t.errorEnviar);
    } finally {
      setCargando(false);
    }
  }

  async function confirmar() {
    setCargando(true);
    setError("");
    try {
      await api.post("/auth/recuperar/confirmar", { correo: correo.trim(), codigo, nueva });
      setListo(true);
    } catch (err) {
      setError(traducirMsg(err.response?.data?.mensaje) || t.errorConfirmar);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo={codigoEnviado ? t.revisaCorreo : t.titulo} onClose={() => !cargando && onCerrar()}>
      {listo ? (
        <>
          <p className="text-sm text-center text-[var(--c-verde)] mb-6">{t.exito}</p>
          <Boton className="w-full" onClick={onCerrar}>
            {t.volver}
          </Boton>
        </>
      ) : !codigoEnviado ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (datosListos) enviarCodigo();
          }}
          noValidate
        >
          <p className="text-sm text-[var(--c-texto-sec)] mb-4">{t.descripcion}</p>
          <Input label={tr.login.correo} type="email" value={correo} onChange={(e) => setCorreo(e.target.value.trim())} />
          <Input label={t.nueva} type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          <Input
            label={t.repetir}
            type="password"
            autoComplete="new-password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
          />
          <p className="text-xs text-[var(--c-texto-tenue)] -mt-1 mb-3">{t.requisitos}</p>
          {repetir && !coincide && <p className="text-xs text-[var(--c-rojo)] mb-3">{tr.perfil.noCoinciden}</p>}
          {error && <p className="text-sm text-[var(--c-rojo)] mb-3">{error}</p>}
          <Boton type="submit" className="w-full" disabled={!datosListos || cargando}>
            {cargando ? t.enviando : t.enviarCodigo}
          </Boton>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (codigo.length === 6) confirmar();
          }}
          noValidate
        >
          <p className="text-sm text-[var(--c-texto-sec)] mb-4">{t.codigoEnviado(correo.trim())}</p>
          <Input
            label={t.codigo}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {error && <p className="text-sm text-[var(--c-rojo)] mb-3">{error}</p>}
          <div className="flex justify-between text-sm mb-4">
            <button
              type="button"
              className="text-[var(--c-texto-sec)] hover:text-[var(--c-acento)]"
              onClick={() => {
                setCodigoEnviado(false);
                setError("");
              }}
            >
              {t.cambiarDatos}
            </button>
            <button
              type="button"
              disabled={espera > 0 || cargando}
              className={espera > 0 ? "text-[var(--c-texto-tenue)]" : "text-[var(--c-acento)] hover:underline"}
              onClick={enviarCodigo}
            >
              {espera > 0 ? t.reenviarEn(espera) : t.reenviar}
            </button>
          </div>
          <Boton type="submit" className="w-full" disabled={codigo.length !== 6 || cargando}>
            {t.confirmar}
          </Boton>
        </form>
      )}
    </Modal>
  );
}
