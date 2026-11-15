// Perfil del personal que inició sesión (igual que el Perfil de Recepción de la app):
// datos de la cuenta, cambiar el teléfono y cambiar la contraseña.
import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Input from "../../components/ui/Input.jsx";
import { fecha, limpiarTelefono, tarjetaClase } from "../../utils/formato.js";

export default function Perfil() {
  const { tr, traducirMsg, esIngles } = useIdioma();
  const t = tr.perfil;

  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");

  const [telefono, setTelefono] = useState("");
  const [msgTel, setMsgTel] = useState(null); // { ok, texto }
  const [guardandoTel, setGuardandoTel] = useState(false);

  const [pw, setPw] = useState({ actual: "", nueva: "", confirmar: "" });
  const [msgPw, setMsgPw] = useState(null);
  const [guardandoPw, setGuardandoPw] = useState(false);

  async function cargar() {
    try {
      const { data } = await api.get("/perfil");
      setPerfil(data.perfil);
      setTelefono(data.perfil.telefono || "");
      setError("");
    } catch (err) {
      setError(traducirMsg(err.response?.data?.mensaje) || t.errorCargar);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardarTelefono(e) {
    e.preventDefault();
    if (!/^\d{10}$/.test(telefono)) {
      setMsgTel({ ok: false, texto: tr.visitas.valTelefono });
      return;
    }
    setGuardandoTel(true);
    try {
      await api.put("/perfil/telefono", { telefono });
      setMsgTel({ ok: true, texto: t.telefonoGuardado });
      cargar();
    } catch (err) {
      setMsgTel({ ok: false, texto: traducirMsg(err.response?.data?.mensaje) || t.errorGuardar });
    } finally {
      setGuardandoTel(false);
    }
  }

  async function guardarContrasena(e) {
    e.preventDefault();
    if (!pw.actual || !pw.nueva || !pw.confirmar) {
      setMsgPw({ ok: false, texto: t.faltanCampos });
      return;
    }
    if (pw.nueva !== pw.confirmar) {
      setMsgPw({ ok: false, texto: t.noCoinciden });
      return;
    }
    setGuardandoPw(true);
    try {
      await api.put("/perfil/contrasena", { actual: pw.actual, nueva: pw.nueva });
      setMsgPw({ ok: true, texto: t.contrasenaGuardada });
      setPw({ actual: "", nueva: "", confirmar: "" });
    } catch (err) {
      // Las reglas de la contraseña (largo, mayúsculas, etc.) las valida la base
      setMsgPw({ ok: false, texto: traducirMsg(err.response?.data?.mensaje) || t.errorGuardar });
    } finally {
      setGuardandoPw(false);
    }
  }

  const Fila = ({ etiqueta, valor }) => (
    <div className="flex justify-between gap-4 py-2 border-b border-[var(--c-borde-30)] last:border-0 text-sm">
      <span className="text-[var(--c-texto-sec)]">{etiqueta}</span>
      <span className="text-[var(--c-texto)] text-right break-all">{valor}</span>
    </div>
  );

  const Mensaje = ({ m }) =>
    m ? (
      <p className={`text-sm mb-3 ${m.ok ? "text-[var(--c-verde)]" : "text-[var(--c-rojo)]"}`}>{m.texto}</p>
    ) : null;

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-[var(--c-texto)] mb-6">{t.titulo}</h1>
      {error && <p className="text-sm text-[var(--c-rojo)] mb-3">{error}</p>}

      {perfil && (
        <div className={`${tarjetaClase} mb-6`}>
          <Fila etiqueta={t.nombre} valor={perfil.nombre} />
          <Fila etiqueta={t.correo} valor={perfil.correo} />
          <Fila etiqueta={t.telefono} valor={perfil.telefono || t.sinTelefono} />
          <Fila etiqueta={t.rol} valor={t.roles[perfil.rol] || perfil.rol} />
          <Fila etiqueta={t.estado} valor={tr.estados?.[perfil.estado] || perfil.estado} />
          <Fila etiqueta={t.registro} valor={fecha(perfil.fechaRegistro, esIngles)} />
        </div>
      )}

      <form className={`${tarjetaClase} mb-6`} onSubmit={guardarTelefono} noValidate>
        <p className="text-sm font-semibold text-[var(--c-texto)] mb-3">{t.editarTelefono}</p>
        <Input
          label={t.nuevoTelefono}
          value={telefono}
          inputMode="numeric"
          onChange={(e) => {
            setTelefono(limpiarTelefono(e.target.value));
            setMsgTel(null);
          }}
        />
        <Mensaje m={msgTel} />
        <Boton type="submit" disabled={guardandoTel}>
          {t.guardarTelefono}
        </Boton>
      </form>

      <form className={tarjetaClase} onSubmit={guardarContrasena} noValidate>
        <p className="text-sm font-semibold text-[var(--c-texto)] mb-3">{t.cambiarContrasena}</p>
        {[
          ["actual", t.contrasenaActual, "current-password"],
          ["nueva", t.contrasenaNueva, "new-password"],
          ["confirmar", t.confirmarContrasena, "new-password"],
        ].map(([campo, etiqueta, auto]) => (
          <Input
            key={campo}
            label={etiqueta}
            type="password"
            autoComplete={auto}
            value={pw[campo]}
            onChange={(e) => {
              setPw((p) => ({ ...p, [campo]: e.target.value }));
              setMsgPw(null);
            }}
          />
        ))}
        <Mensaje m={msgPw} />
        <Boton type="submit" disabled={guardandoPw}>
          {t.guardarContrasena}
        </Boton>
      </form>
    </div>
  );
}
