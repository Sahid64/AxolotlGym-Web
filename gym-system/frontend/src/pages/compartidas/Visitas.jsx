// Cobro de visitas (pase de un día), igual que la app. No crea cliente ni membresía:
// solo guarda los datos del visitante y el cobro, que entra directo en los ingresos.
// El precio es el del servicio marcado como "Es la visita" en Servicios. El Encargado
// siempre puede cobrarla; Recepción solo si la visita es visible para Recepción.
import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import { dinero, limpiarLetras, limpiarTelefono, contarLetras, tarjetaClase } from "../../utils/formato.js";

const METODOS = ["Efectivo", "Tarjeta"];
const vacio = { nombre: "", telefono: "", contactoNombre: "", contactoTelefono: "", metodo: "Efectivo" };

export default function Visitas() {
  const { usuario } = useAuth();
  const { tr, traducirMsg } = useIdioma();
  const t = tr.visitas;
  const esEncargado = usuario?.rol === "encargado" || usuario?.rol === "dueno";

  const [precio, setPrecio] = useState(0);
  const [visibleRecepcion, setVisibleRecepcion] = useState(true);
  const [visitas, setVisitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(vacio);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function cargar() {
    try {
      const { data } = await api.get("/visitas");
      setPrecio(data.precio || 0);
      setVisibleRecepcion(Boolean(data.visibleRecepcion));
      setVisitas(data.visitas || []);
      setError("");
    } catch (err) {
      setError(traducirMsg(err.response?.data?.mensaje) || t.errorCargar);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const precioFijado = precio > 0;
  const disponible = precioFijado && (esEncargado || visibleRecepcion);
  const formValido =
    contarLetras(form.nombre) >= 3 &&
    form.telefono.length === 10 &&
    contarLetras(form.contactoNombre) >= 3 &&
    form.contactoTelefono.length === 10;

  const cambiar = (campo, limpiar) => (e) => setForm((f) => ({ ...f, [campo]: limpiar(e.target.value) }));

  async function cobrar() {
    setProcesando(true);
    try {
      await api.post("/visitas", { ...form, nombre: form.nombre.trim(), contactoNombre: form.contactoNombre.trim() });
      setMensaje(traducirMsg(`Visita de ${form.nombre.trim()} cobrada.`));
      setError("");
      setForm(vacio);
      cargar();
    } catch (err) {
      setMensaje("");
      setError(traducirMsg(err.response?.data?.mensaje) || t.errorGuardar);
    } finally {
      setProcesando(false);
      setConfirmar(false);
    }
  }

  let estadoPrecio = t.precio(dinero(precio));
  if (cargando) estadoPrecio = t.cargando;
  else if (!precioFijado) estadoPrecio = t.sinPrecio;
  else if (!disponible) estadoPrecio = t.noParaRecepcion;

  const columnas = [
    { key: "nombre", label: t.colNombre },
    { key: "telefono", label: t.colTelefono },
    { key: "hora", label: t.colHora },
    { key: "monto", label: t.colMonto, render: (v) => dinero(v.monto) },
    { key: "metodo", label: t.colMetodo, render: (v) => tr.clientes.metodos[v.metodo] || v.metodo },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--c-texto)] mb-1">{t.titulo}</h1>
      <p
        className={`text-sm font-medium mb-6 ${
          cargando || disponible ? "text-[var(--c-acento)]" : "text-[var(--c-rojo)]"
        }`}
      >
        {estadoPrecio}
      </p>

      {mensaje && <p className="text-sm text-[var(--c-verde)] mb-3">{mensaje}</p>}
      {error && <p className="text-sm text-[var(--c-rojo)] mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_1fr] gap-6 items-start">
        <form
          className={tarjetaClase}
          onSubmit={(e) => {
            e.preventDefault();
            if (disponible && formValido) setConfirmar(true);
          }}
          noValidate
        >
          <p className="text-sm font-semibold text-[var(--c-texto)] mb-3">{t.visitante}</p>
          <Input label={t.nombre} value={form.nombre} onChange={cambiar("nombre", limpiarLetras)} disabled={procesando} />
          {form.nombre && contarLetras(form.nombre) < 3 && <Aviso msg={t.valNombre} />}
          <Input
            label={t.telefono}
            value={form.telefono}
            inputMode="numeric"
            onChange={cambiar("telefono", limpiarTelefono)}
            disabled={procesando}
          />
          {form.telefono && form.telefono.length !== 10 && <Aviso msg={t.valTelefono} />}

          <p className="text-sm font-semibold text-[var(--c-texto)] mt-4 mb-3">{t.emergencia}</p>
          <Input
            label={t.nombre}
            value={form.contactoNombre}
            onChange={cambiar("contactoNombre", limpiarLetras)}
            disabled={procesando}
          />
          {form.contactoNombre && contarLetras(form.contactoNombre) < 3 && <Aviso msg={t.valNombre} />}
          <Input
            label={t.telefono}
            value={form.contactoTelefono}
            inputMode="numeric"
            onChange={cambiar("contactoTelefono", limpiarTelefono)}
            disabled={procesando}
          />
          {form.contactoTelefono && form.contactoTelefono.length !== 10 && <Aviso msg={t.valTelefono} />}

          <p className="text-sm font-semibold text-[var(--c-texto)] mt-4 mb-2">{t.metodo}</p>
          <div className="flex gap-2 mb-5">
            {METODOS.map((m) => (
              <button
                type="button"
                key={m}
                disabled={procesando}
                onClick={() => setForm((f) => ({ ...f, metodo: m }))}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  form.metodo === m
                    ? "border-[var(--c-acento)] bg-[var(--c-acento-15)] text-[var(--c-texto)]"
                    : "border-[var(--c-borde)] text-[var(--c-texto-sec)] hover:border-[var(--c-acento)]"
                }`}
              >
                {tr.clientes.metodos[m] || m}
              </button>
            ))}
          </div>

          <Boton type="submit" variante="exito" className="w-full" disabled={!disponible || !formValido || procesando}>
            {t.cobrar(dinero(precio))}
          </Boton>
        </form>

        <div>
          <p className="text-base font-semibold text-[var(--c-texto)] mb-3">{t.hoy(visitas.length)}</p>
          <Table columnas={columnas} filas={visitas} vacio={cargando ? t.cargando : t.ningunaHoy} />
        </div>
      </div>

      <Modal abierto={confirmar} titulo={t.confirmarTitulo} onClose={() => !procesando && setConfirmar(false)}>
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {t.confirmarMsg(dinero(precio), form.nombre.trim(), tr.clientes.metodos[form.metodo] || form.metodo)}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" disabled={procesando} onClick={() => setConfirmar(false)}>
            {tr.cancelar}
          </Boton>
          <Boton variante="exito" className="flex-1" disabled={procesando} onClick={cobrar}>
            {t.confirmarBtn}
          </Boton>
        </div>
      </Modal>
    </div>
  );
}

const Aviso = ({ msg }) => <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{msg}</p>;
