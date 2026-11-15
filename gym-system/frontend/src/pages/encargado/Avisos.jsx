// Avisos por correo (comunicados), igual que la app. Solo el Encargado.
// Términos y Privacidad piden 15 días de anticipación; Horario, 3 (Términos punto 25,
// Política punto 12). Se puede publicar con menos, pero se muestra una advertencia.
import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import { fecha, hoyLocal, sumarDias, diasEntre, campoClase, tarjetaClase } from "../../utils/formato.js";

const DIAS_MINIMOS = { TERMINOS: 15, PRIVACIDAD: 15, HORARIO: 3 };

const formInicial = () => ({
  tipo: "HORARIO",
  titulo: "",
  mensaje: "",
  fechaVigor: sumarDias(hoyLocal(), DIAS_MINIMOS.HORARIO),
});

export default function Avisos() {
  const { tr, traducirMsg, esIngles } = useIdioma();
  const t = tr.avisos;

  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null); // { ok, texto }
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [errores, setErrores] = useState({});
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    try {
      const { data } = await api.get("/avisos");
      setAvisos(data.avisos || []);
    } catch (err) {
      setAviso({ ok: false, texto: traducirMsg(err.response?.data?.mensaje) || t.errorCargar });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const hayPendientes = avisos.some((a) => a.enviados < a.destinatarios);
  const minimos = DIAS_MINIMOS[form.tipo];
  const diasAviso = form.fechaVigor ? diasEntre(hoyLocal(), form.fechaVigor) : 0;

  function abrir() {
    setForm(formInicial());
    setErrores({});
    setModal(true);
  }

  function cambiarTipo(tipo) {
    // Al cambiar el tipo se sugiere la fecha mínima que piden los Términos
    setForm((f) => ({ ...f, tipo, fechaVigor: sumarDias(hoyLocal(), DIAS_MINIMOS[tipo]) }));
  }

  function validar(e) {
    e.preventDefault();
    const errs = {
      titulo: form.titulo.trim().length < 3 ? t.valTitulo : "",
      mensaje: form.mensaje.trim().length < 10 ? t.valMensaje : "",
      fechaVigor: !form.fechaVigor || form.fechaVigor < hoyLocal() ? t.valFecha : "",
    };
    setErrores(errs);
    if (!Object.values(errs).some(Boolean)) setConfirmar(true);
  }

  async function publicar() {
    setEnviando(true);
    try {
      const { data } = await api.post("/avisos", {
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        fechaVigor: form.fechaVigor,
      });
      setAviso({ ok: data.enviado, texto: traducirMsg(data.mensaje) });
      setModal(false);
      cargar();
    } catch (err) {
      setErrores({ general: traducirMsg(err.response?.data?.mensaje) || t.errorPublicar });
    } finally {
      setEnviando(false);
      setConfirmar(false);
    }
  }

  async function enviarPendientes() {
    setEnviando(true);
    try {
      const { data } = await api.post("/avisos/enviar");
      setAviso({ ok: true, texto: traducirMsg(data.mensaje) });
    } catch (err) {
      setAviso({ ok: false, texto: traducirMsg(err.response?.data?.mensaje) || t.errorPublicar });
    } finally {
      setEnviando(false);
      cargar();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--c-texto)]">{t.titulo}</h1>
          <p className="text-sm text-[var(--c-texto-sec)] mt-1 max-w-2xl">{t.subtitulo}</p>
        </div>
        <div className="flex gap-2">
          {hayPendientes && (
            <Boton variante="outline" disabled={enviando} onClick={enviarPendientes}>
              {enviando ? t.enviando : t.enviarPendientes}
            </Boton>
          )}
          <Boton onClick={abrir}>{t.nuevo}</Boton>
        </div>
      </div>

      {aviso && (
        <p className={`text-sm mb-4 ${aviso.ok ? "text-[var(--c-verde)]" : "text-[var(--c-ambar-texto)]"}`}>
          {aviso.texto}
        </p>
      )}

      {!cargando && avisos.length === 0 && (
        <p className="text-sm text-center text-[var(--c-texto-tenue)] py-8">{t.vacio}</p>
      )}

      <div className="space-y-3">
        {avisos.map((a) => {
          const completo = a.enviados >= a.destinatarios;
          return (
            <div key={a.id} className={tarjetaClase}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--c-acento-15)] text-[var(--c-acento-texto)]">
                  {t.tipos[a.tipo] || a.tipo}
                </span>
                <span className="text-xs text-[var(--c-texto-sec)]">{t.aplicaDesde(fecha(a.fechaVigor, esIngles))}</span>
              </div>
              <p className="font-semibold text-[var(--c-texto)]">{a.titulo}</p>
              <p className="text-sm text-[var(--c-texto-sec)] whitespace-pre-line mt-1">{a.mensaje}</p>
              <div className="flex flex-wrap justify-between gap-2 mt-3 text-xs">
                <span className="text-[var(--c-texto-tenue)]">{t.meta(fecha(a.creadoEn, esIngles), a.publico || "—")}</span>
                <span className={completo ? "text-[var(--c-verde)]" : "text-[var(--c-ambar-texto)]"}>
                  {t.progreso(a.enviados, a.destinatarios)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal abierto={modal} titulo={t.nuevo} onClose={() => !enviando && setModal(false)}>
        <form onSubmit={validar} noValidate>
          <p className="text-sm font-medium text-[var(--c-texto-sec)] mb-2">{t.tipo}</p>
          <div className="space-y-2 mb-2">
            {Object.keys(DIAS_MINIMOS).map((tipo) => (
              <label key={tipo} className="flex items-center gap-2 text-sm text-[var(--c-texto)] cursor-pointer">
                <input
                  type="radio"
                  name="tipoAviso"
                  checked={form.tipo === tipo}
                  onChange={() => cambiarTipo(tipo)}
                  className="accent-[var(--c-acento)]"
                />
                {t.tipos[tipo]}
              </label>
            ))}
          </div>
          <p className="text-xs text-[var(--c-texto-tenue)] mb-4">{t.diasMinimos(minimos)}</p>

          <Input
            label={t.campoTitulo}
            placeholder={t.campoTituloHint}
            maxLength={120}
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
          {errores.titulo && <Err msg={errores.titulo} />}

          <label className="block mb-3">
            <span className="block text-sm font-medium text-[var(--c-texto-sec)] mb-1">{t.campoMensaje}</span>
            <textarea
              rows={4}
              maxLength={1500}
              className={campoClase}
              placeholder={form.tipo === "HORARIO" ? t.campoMensajeHintHorario : t.campoMensajeHintTerminos}
              value={form.mensaje}
              onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
            />
          </label>
          {errores.mensaje && <Err msg={errores.mensaje} />}

          <Input
            label={t.fecha}
            type="date"
            min={hoyLocal()}
            value={form.fechaVigor}
            onChange={(e) => setForm((f) => ({ ...f, fechaVigor: e.target.value }))}
          />
          {errores.fechaVigor && <Err msg={errores.fechaVigor} />}
          {form.fechaVigor && diasAviso >= 0 && diasAviso < minimos && (
            <p className="text-xs text-[var(--c-ambar-texto)] -mt-2 mb-3">{t.advertenciaPoco(minimos, diasAviso)}</p>
          )}

          <p className="text-xs text-[var(--c-texto-tenue)] mb-4">{t.notaDestinatarios}</p>
          {errores.general && <Err msg={errores.general} />}

          <Boton type="submit" className="w-full" disabled={enviando}>
            {t.publicar}
          </Boton>
        </form>
      </Modal>

      <Modal abierto={confirmar} titulo={t.confirmarTitulo} onClose={() => !enviando && setConfirmar(false)}>
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">{t.confirmarMsg}</p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" disabled={enviando} onClick={() => setConfirmar(false)}>
            {tr.cancelar}
          </Boton>
          <Boton className="flex-1" disabled={enviando} onClick={publicar}>
            {enviando ? t.enviando : t.publicar}
          </Boton>
        </div>
      </Modal>
    </div>
  );
}

const Err = ({ msg }) => <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{msg}</p>;
