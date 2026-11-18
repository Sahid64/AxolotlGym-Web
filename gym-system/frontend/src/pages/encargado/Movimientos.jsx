// Movimientos por rol (bitácora de auditoría). Solo el Encargado.
// Los datos vienen de la función SQL movimientos_de_rol por bloques (p_limite / p_offset).
// El filtro por rol se aplica en la base; la búsqueda, sobre los movimientos ya cargados.
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Table from "../../components/ui/Table.jsx";
import { campoClase, tarjetaClase } from "../../utils/formato.js";

const BLOQUE = 50;
const ROLES = ["", "ENCARGADO", "RECEPCION", "INSTRUCTOR", "CLIENTE"];

const estiloRol = {
  ENCARGADO: "bg-[var(--c-acento-15)] text-[var(--c-acento-texto)]",
  RECEPCION: "bg-[var(--c-verde-bg)] text-[var(--c-verde-texto)]",
  INSTRUCTOR: "bg-[var(--c-borde-20)] text-[var(--c-texto)]",
  CLIENTE: "bg-[var(--c-borde-20)] text-[var(--c-texto-sec)]",
};

const estiloAccion = {
  INSERT: "text-[var(--c-verde)]",
  PAGO: "text-[var(--c-verde)]",
  UPDATE: "text-[var(--c-acento)]",
  CAMBIO_PERMISO: "text-[var(--c-ambar-texto)]",
  DELETE: "text-[var(--c-rojo)]",
  CANCELACION: "text-[var(--c-rojo)]",
  LOGIN: "text-[var(--c-texto)]",
};

const tieneValores = (v) => v != null && !(typeof v === "object" && Object.keys(v).length === 0);

// fecha_hora_mx llega sin zona (ya es hora de CDMX): se muestra tal cual, sin convertir
function fechaHora(valor, esIngles) {
  if (!valor) return "—";
  const d = new Date(String(valor).replace(" ", "T").slice(0, 19));
  if (Number.isNaN(d.getTime())) return String(valor);
  return d.toLocaleString(esIngles ? "en-US" : "es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Movimientos() {
  const { tr, traducirMsg, esIngles } = useIdioma();
  const t = tr.movimientos;

  const [rol, setRol] = useState("");
  const [buscar, setBuscar] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMas, setHayMas] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState(null);
  const peticion = useRef(0); // descarta respuestas viejas si se cambia de rol rápido

  async function cargar(desde = 0) {
    const id = ++peticion.current;
    desde === 0 ? setCargando(true) : setCargandoMas(true);
    setError("");
    try {
      const { data } = await api.get("/movimientos", {
        params: { rol: rol || undefined, limite: BLOQUE, offset: desde },
      });
      if (id !== peticion.current) return;
      const nuevos = data.movimientos || [];
      setMovimientos((prev) => (desde === 0 ? nuevos : [...prev, ...nuevos]));
      setHayMas(Boolean(data.hayMas));
    } catch (err) {
      if (id !== peticion.current) return;
      setError(traducirMsg(err.response?.data?.mensaje) || t.errorCargar);
      if (desde === 0) setMovimientos([]);
    } finally {
      if (id === peticion.current) {
        setCargando(false);
        setCargandoMas(false);
      }
    }
  }

  useEffect(() => {
    cargar(0);
  }, [rol]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return movimientos;
    return movimientos.filter(
      (m) =>
        (m.usuario || "").toLowerCase().includes(q) ||
        (m.gmail || "").toLowerCase().includes(q) ||
        (m.descripcion || "").toLowerCase().includes(q)
    );
  }, [movimientos, buscar]);

  const nombreRol = (r) => (r === "SIN ROL" ? t.sinRol : tr.roles[String(r || "").toLowerCase()] || r);
  const nombreAccion = (a) => t.acciones[a] || a;
  const conCambios = (m) => tieneValores(m.valoresAnteriores) || tieneValores(m.valoresNuevos);

  const BadgeRol = ({ valor }) => (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        estiloRol[valor] || "bg-[var(--c-borde-20)] text-[var(--c-texto-sec)]"
      }`}
    >
      {nombreRol(valor)}
    </span>
  );

  const Accion = ({ valor }) => (
    <span className={`text-xs font-semibold whitespace-nowrap ${estiloAccion[valor] || "text-[var(--c-texto-sec)]"}`}>
      {nombreAccion(valor)}
    </span>
  );

  const BotonDetalle = ({ m }) =>
    conCambios(m) ? (
      <Boton tamano="sm" variante="outline" onClick={() => setDetalle(m)}>
        {t.verDetalle}
      </Boton>
    ) : (
      <span className="text-[var(--c-texto-tenue)]">—</span>
    );

  const columnas = [
    {
      key: "usuario",
      label: t.colUsuario,
      render: (m) => (
        <div className="text-left min-w-[140px]">
          <p className="font-medium">{m.usuario || t.sistema}</p>
          {m.gmail && <p className="text-xs text-[var(--c-texto-tenue)] break-all">{m.gmail}</p>}
        </div>
      ),
    },
    { key: "rol", label: t.colRol, render: (m) => <BadgeRol valor={m.rol} /> },
    { key: "tipoAccion", label: t.colAccion, render: (m) => <Accion valor={m.tipoAccion} /> },
    { key: "modulo", label: t.colModulo, render: (m) => <span className="capitalize">{m.modulo}</span> },
    {
      key: "descripcion",
      label: t.colDescripcion,
      render: (m) => <p className="text-left max-w-md text-[var(--c-texto-sec)]">{m.descripcion || "—"}</p>,
    },
    {
      key: "fechaHoraMx",
      label: t.colFecha,
      render: (m) => <span className="whitespace-nowrap">{fechaHora(m.fechaHoraMx, esIngles)}</span>,
    },
    { key: "detalle", label: t.colDetalle, render: (m) => <BotonDetalle m={m} /> },
  ];

  const sinDatos = !cargando && !error && filtrados.length === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--c-texto)]">{t.titulo}</h1>
        <p className="text-sm text-[var(--c-texto-sec)] mt-1 max-w-2xl">{t.subtitulo}</p>
      </div>

      {/* Buscador con lupa */}
      <div className="relative mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-texto-tenue)] pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder={t.buscar}
          aria-label={t.buscar}
          className={`${campoClase} pl-9`}
        />
      </div>

      {/* Pestañas por rol */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" role="tablist">
        {ROLES.map((r) => {
          const activo = rol === r;
          return (
            <button
              key={r || "todos"}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setRol(r)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activo
                  ? "border-[var(--c-acento)] bg-[var(--c-acento-15)] text-[var(--c-acento-texto)] font-bold"
                  : "border-[var(--c-borde)] text-[var(--c-texto-sec)] hover:bg-[var(--c-borde-20)]"
              }`}
            >
              {r ? nombreRol(r) : t.todos}
            </button>
          );
        })}
      </div>

      {error && (
        <div className={`${tarjetaClase} mb-4 flex flex-wrap items-center justify-between gap-3`}>
          <p className="text-sm text-[var(--c-rojo)]">{error}</p>
          <Boton tamano="sm" variante="outline" onClick={() => cargar(movimientos.length && !cargando ? movimientos.length : 0)}>
            {t.reintentar}
          </Boton>
        </div>
      )}

      {cargando ? (
        <Esqueleto texto={t.cargando} />
      ) : sinDatos ? (
        <div className={`${tarjetaClase} text-center py-10`}>
          <p className="text-sm text-[var(--c-texto-tenue)]">{buscar.trim() ? t.vacioBusqueda : t.vacio}</p>
        </div>
      ) : (
        filtrados.length > 0 && (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block">
              <Table columnas={columnas} filas={filtrados} />
            </div>

            {/* Móvil: tarjetas */}
            <div className="md:hidden space-y-3">
              {filtrados.map((m) => (
                <div key={m.id} className={`${tarjetaClase} !p-4`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--c-texto)] truncate">{m.usuario || t.sistema}</p>
                      {m.gmail && <p className="text-xs text-[var(--c-texto-tenue)] truncate">{m.gmail}</p>}
                    </div>
                    <BadgeRol valor={m.rol} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-1">
                    <Accion valor={m.tipoAccion} />
                    <span className="text-[var(--c-texto-tenue)]">·</span>
                    <span className="capitalize text-[var(--c-texto-sec)]">{m.modulo}</span>
                  </div>
                  {m.descripcion && <p className="text-sm text-[var(--c-texto-sec)] break-words">{m.descripcion}</p>}
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <span className="text-xs text-[var(--c-texto-tenue)]">{fechaHora(m.fechaHoraMx, esIngles)}</span>
                    {conCambios(m) && <BotonDetalle m={m} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {!cargando && movimientos.length > 0 && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <p className="text-xs text-[var(--c-texto-tenue)]">{t.mostrando(movimientos.length)}</p>
          {buscar.trim() && hayMas && <p className="text-xs text-[var(--c-texto-tenue)] text-center">{t.notaBusqueda}</p>}
          {hayMas && (
            <Boton variante="outline" disabled={cargandoMas} onClick={() => cargar(movimientos.length)}>
              {cargandoMas ? t.cargandoMas : t.mostrarMas}
            </Boton>
          )}
        </div>
      )}

      <Modal abierto={!!detalle} titulo={t.detalleTitulo} onClose={() => setDetalle(null)}>
        {detalle && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <BadgeRol valor={detalle.rol} />
              <Accion valor={detalle.tipoAccion} />
              <span className="text-xs text-[var(--c-texto-tenue)]">{fechaHora(detalle.fechaHoraMx, esIngles)}</span>
            </div>
            <p className="text-sm font-medium text-[var(--c-texto)]">{detalle.usuario || t.sistema}</p>
            {detalle.descripcion && <p className="text-sm text-[var(--c-texto-sec)] mt-1 mb-4">{detalle.descripcion}</p>}
            <Comparacion antes={detalle.valoresAnteriores} despues={detalle.valoresNuevos} t={t} />
          </div>
        )}
      </Modal>
    </div>
  );
}

// Antes / después lado a lado. Une las claves de ambos JSON y resalta las que cambiaron.
const esObjeto = (v) => v && typeof v === "object" && !Array.isArray(v);
const textoValor = (v) =>
  v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);

function Comparacion({ antes, despues, t }) {
  // Si alguno no es un objeto (arreglo, texto…), se muestran los dos JSON completos
  if ((tieneValores(antes) && !esObjeto(antes)) || (tieneValores(despues) && !esObjeto(despues))) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          [t.anteriores, antes],
          [t.nuevos, despues],
        ].map(([titulo, v]) => (
          <div key={titulo}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-acento)] mb-1.5">{titulo}</p>
            <pre className="text-xs rounded-md border border-[var(--c-borde)] bg-[var(--c-campo)] text-[var(--c-texto)] p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {tieneValores(v) ? JSON.stringify(v, null, 2) : t.sinValores}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  const a = antes || {};
  const d = despues || {};
  const claves = [...new Set([...Object.keys(a), ...Object.keys(d)])];
  const hayAntes = tieneValores(antes);
  const hayDespues = tieneValores(despues);

  return (
    <div className="rounded-md border border-[var(--c-borde)] bg-[var(--c-campo)] overflow-hidden">
      {/* Encabezado (en móvil cada campo se apila) */}
      <div className="hidden sm:grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,2fr)] gap-3 px-3 py-2 border-b border-[var(--c-borde-suave)] text-xs font-semibold uppercase tracking-wide text-[var(--c-acento)]">
        <span>{t.campo}</span>
        <span>{t.anteriores}</span>
        <span>{t.nuevos}</span>
      </div>
      <div className="divide-y divide-[var(--c-borde-30)]">
        {claves.map((k) => {
          const va = textoValor(a[k]);
          const vd = textoValor(d[k]);
          const cambio = hayAntes && hayDespues && va !== vd;
          return (
            <div
              key={k}
              className={`grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,2fr)] gap-1 sm:gap-3 px-3 py-2 text-xs ${
                cambio ? "bg-[var(--c-acento-10)]" : ""
              }`}
            >
              <span className="font-medium text-[var(--c-texto-sec)] break-words">
                {k}
                {cambio && <span className="ml-1.5 text-[10px] font-bold text-[var(--c-acento-texto)]">· {t.cambio}</span>}
              </span>
              <span className={`break-all ${cambio ? "text-[var(--c-rojo-texto)] line-through decoration-1" : "text-[var(--c-texto)]"}`}>
                <span className="sm:hidden text-[var(--c-texto-tenue)] no-underline">{t.anteriores}: </span>
                {hayAntes ? va : "—"}
              </span>
              <span className={`break-all ${cambio ? "text-[var(--c-verde-texto)] font-medium" : "text-[var(--c-texto)]"}`}>
                <span className="sm:hidden text-[var(--c-texto-tenue)] font-normal">{t.nuevos}: </span>
                {hayDespues ? vd : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Esqueleto de carga con la misma forma que la tabla / tarjetas
function Esqueleto({ texto }) {
  return (
    <div aria-busy="true" aria-label={texto}>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 md:h-11 rounded-lg bg-[var(--c-tarjeta)] border border-[var(--c-borde)] animate-pulse"
          />
        ))}
      </div>
      <p className="text-xs text-center text-[var(--c-texto-tenue)] mt-3">{texto}</p>
    </div>
  );
}
