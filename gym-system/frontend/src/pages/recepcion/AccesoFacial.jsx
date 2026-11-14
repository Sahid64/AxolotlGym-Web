import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Boton from "../../components/ui/Boton.jsx";
import CamaraFacial from "../../components/facial/CamaraFacial.jsx";

const tarjeta = "bg-[var(--c-tarjeta)] border border-[var(--c-borde)] rounded-lg p-6";

// Resultados que cuentan como registro correcto (verde); los demas se muestran en rojo/ambar
const TIPO_AVISO = {
  ENTRADA: "ok",
  SALIDA: "ok",
  REPETIDO: "info",
  YA_DENTRO: "info",
  SIN_ENTRADA: "info",
  DENEGADO: "error",
  NO_RECONOCIDO: "error",
};

const ESTILO_AVISO = {
  ok: "border-[var(--c-verde)] bg-[var(--c-verde-bg)] text-[var(--c-verde-texto)]",
  info: "border-[var(--c-ambar)] bg-[var(--c-acento-15)] text-[var(--c-ambar-texto)]",
  error: "border-[var(--c-rojo)] bg-[var(--c-rojo-bg)] text-[var(--c-rojo-texto)]",
};

const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

// Recepcion: toma de lista con reconocimiento facial.
// El cliente se para frente a la camara y se registra su ENTRADA (o SALIDA si ya estaba dentro).
export default function AccesoFacial() {
  const { tr, traducirMsg } = useIdioma();
  const t = tr.facial;

  const [ultimo, setUltimo] = useState(null); // { cliente, resultado, esEntrada, fechaHora }
  const [aviso, setAviso] = useState(null); // { tipo, texto }
  const [asistencia, setAsistencia] = useState({ total: 0, dentro: [] });

  useEffect(() => {
    cargarAsistencia();
    const id = setInterval(cargarAsistencia, 30000); // tambien ve lo que registra la app
    return () => clearInterval(id);
  }, []);

  // El aviso se quita solo despues de unos segundos
  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(id);
  }, [aviso]);

  async function cargarAsistencia() {
    try {
      const { data } = await api.get("/acceso/hoy");
      setAsistencia({ total: data.total, dentro: data.dentro });
    } catch {
      /* se reintenta en el siguiente ciclo */
    }
  }

  // Lo llama la camara cuando ya tiene el vector del rostro
  async function alReconocer(vector) {
    try {
      const { data } = await api.post("/acceso/rostro", { embedding: vector });
      if (data.cliente) setUltimo({ ...data, cliente: data.cliente });
      setAviso({ tipo: TIPO_AVISO[data.resultado] || "error", texto: traducirMsg(data.mensaje) });
      if (data.ok) cargarAsistencia();
      // Si no lo reconocio, se deja intentar otra vez sin que se retire
      if (data.resultado === "NO_RECONOCIDO") throw new Error("no reconocido");
    } catch (err) {
      if (err.message !== "no reconocido") {
        setAviso({ tipo: "error", texto: traducirMsg(err.response?.data?.mensaje) || t.errorRegistrar });
      }
      throw err; // la camara espera un momento y vuelve a intentar
    }
  }

  // Correccion manual (por si el cliente se fue sin registrar salida, etc.)
  async function registrarManual(tipo) {
    if (!ultimo?.cliente) return;
    try {
      const { data } = await api.post("/qr/registrar", { numMembresia: ultimo.cliente.numMembresia, tipo });
      setAviso({ tipo: "ok", texto: traducirMsg(data.mensaje) });
      cargarAsistencia();
    } catch (err) {
      setAviso({ tipo: "info", texto: traducirMsg(err.response?.data?.mensaje) || t.errorRegistrar });
    }
  }

  const c = ultimo?.cliente;

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--c-texto)] mb-6">{t.titulo}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ---------- Camara ---------- */}
        <div className={tarjeta}>
          <p className="text-sm font-medium text-[var(--c-texto)] mb-4">{t.subtitulo}</p>
          <CamaraFacial muestrasNecesarias={3} modo="continuo" onRostro={alReconocer} />
        </div>

        <div className="space-y-6">
          {/* ---------- Ultimo registro ---------- */}
          <div className={tarjeta}>
            <p className="text-sm font-medium text-[var(--c-texto)]">{t.ultimoRegistro}</p>
            <div className="my-4 h-px bg-[var(--c-borde-suave)]" />

            {aviso && (
              <p className={`mb-4 rounded-lg border px-4 py-2.5 text-center text-sm font-bold ${ESTILO_AVISO[aviso.tipo]}`}>
                {aviso.texto}
              </p>
            )}

            {!c ? (
              <p className="text-sm text-[var(--c-texto-tenue)] text-center py-6">{t.instruccion}</p>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-[72px] h-[72px] shrink-0 rounded-full border-2 border-[var(--c-acento)] bg-[var(--c-campo)] flex items-center justify-center text-3xl font-bold text-[var(--c-acento)]">
                    {c.nombre?.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-[var(--c-texto)] truncate">{c.nombre}</p>
                    <p className="text-sm text-[var(--c-texto-sec)] mt-1">{t.membresia}: {c.numMembresia}</p>
                    <p className="text-sm text-[var(--c-texto-sec)] mt-1 flex items-center gap-2">
                      {t.estado}: <Badge estado={c.estado} />
                    </p>
                    {ultimo.fechaHora && (
                      <p className="text-sm text-[var(--c-texto-sec)] mt-1">
                        {ultimo.esEntrada ? t.entrada : t.salida}: {hora(ultimo.fechaHora)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="my-4 h-px bg-[var(--c-borde-suave)]" />
                <p className="text-xs text-[var(--c-texto-tenue)] mb-2">{t.correccionManual}</p>
                <div className="flex gap-3">
                  <Boton variante="exito" className="flex-1" onClick={() => registrarManual("entrada")}>
                    {t.entrada}
                  </Boton>
                  <Boton variante="peligro" className="flex-1" onClick={() => registrarManual("salida")}>
                    {t.salida}
                  </Boton>
                </div>
              </>
            )}
          </div>

          {/* ---------- Lista de asistencia de hoy ---------- */}
          <div className={tarjeta}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--c-texto)]">{t.asistenciaHoy}</p>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--c-acento-15)] text-[var(--c-acento)]">
                {t.dentroAhora(asistencia.total)}
              </span>
            </div>
            <div className="my-4 h-px bg-[var(--c-borde-suave)]" />

            {asistencia.dentro.length === 0 ? (
              <p className="text-sm text-[var(--c-texto-tenue)] text-center py-4">{t.nadieDentro}</p>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-[var(--c-borde-suave)]">
                {asistencia.dentro.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="text-[var(--c-texto)] truncate">{p.nombre}</p>
                      <p className="text-xs text-[var(--c-texto-tenue)]">{p.numMembresia}</p>
                    </div>
                    <span className="text-[var(--c-texto-sec)] shrink-0">{t.desde} {hora(p.desde)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
