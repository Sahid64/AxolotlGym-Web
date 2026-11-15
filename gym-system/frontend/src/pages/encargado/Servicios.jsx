import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";

// ---------- Validaciones ----------
const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const REGEX_TEXTO = new RegExp(`^[${LETRAS}0-9]+( [${LETRAS}0-9]+)*$`);

const limpiarTexto = (v) =>
  v.replace(new RegExp(`[^${LETRAS}0-9 ]`, "g"), "").replace(/^\s+/, "").replace(/\s{2,}/g, " ");
const limpiarDecimal = (v) => {
  const s = v.replace(/[^\d.]/g, "");
  const [entero, ...resto] = s.split(".");
  if (resto.length === 0) return entero.slice(0, 7);
  return entero.slice(0, 7) + "." + resto.join("").slice(0, 2);
};

const Err = ({ msg }) =>
  msg ? <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{msg}</p> : null;

const vacio = { nombre: "", duracion: "", precio: "", visible_clientes: true, visible_recepcion: true, es_visita: false };

export default function Servicios() {
  const { tr, traducirMsg, traducirPlan, traducirDuracion } = useIdioma();
  const [servicios, setServicios] = useState([]);
  const [aviso, setAviso] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = creando, id = editando
  const [form, setForm] = useState(vacio);
  const [errores, setErrores] = useState({});

  // Avisos de confirmación antes de guardar o eliminar
  const [confirmandoGuardar, setConfirmandoGuardar] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);

  const vTexto = (v, etiqueta) => {
    const t = v.trim();
    if (!t) return tr.val.esObligatorio(etiqueta);
    if (t.length < 3) return tr.val.minCaracteres(etiqueta);
    if (!REGEX_TEXTO.test(t)) return tr.val.soloLetrasNumeros(etiqueta);
    return "";
  };
  const vMonto = (v, etiqueta) => {
    if (v === "" || v == null) return tr.val.esObligatorio(etiqueta);
    const s = String(v);
    if (!/^\d+(\.\d{1,2})?$/.test(s) || Number(s) <= 0) return tr.val.numeroMayorCero(etiqueta);
    return "";
  };

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await api.get("/servicios");
    setServicios(data.servicios);
  }

  // Actualiza un campo (limpiando lo inválido) y quita su error
  const cambiar = (nombre, limpiar = (v) => v) => (e) => {
    const valor = limpiar(e.target.value);
    setForm((f) => ({ ...f, [nombre]: valor }));
    setErrores((er) => ({ ...er, [nombre]: "" }));
  };

  function abrirNuevo() {
    setEditandoId(null);
    setForm(vacio);
    setErrores({});
    setConfirmandoGuardar(false);
    setModalAbierto(true);
  }

  function abrirEditar(servicio) {
    setEditandoId(servicio.id);
    setForm({
      nombre: servicio.nombre ?? "",
      duracion: servicio.duracion ?? "",
      precio: servicio.precio ?? "",
      visible_clientes: servicio.visible_clientes !== false,
      visible_recepcion: servicio.visible_recepcion !== false,
      es_visita: Boolean(servicio.es_visita),
    });
    setErrores({});
    setConfirmandoGuardar(false);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditandoId(null);
    setForm(vacio);
    setErrores({});
    setConfirmandoGuardar(false);
  }

  function validarYPedirConfirmacion(e) {
    e.preventDefault();

    const errs = {
      nombre: vTexto(form.nombre, tr.servicios.nombre),
      duracion: vTexto(form.duracion, tr.servicios.duracion),
      precio: vMonto(form.precio, tr.servicios.precio),
    };
    setErrores(errs);
    if (Object.values(errs).some(Boolean)) return;

    setConfirmandoGuardar(true);
  }

  async function confirmarGuardarServicio() {
    const datos = {
      ...form,
      nombre: form.nombre.trim(),
      duracion: form.duracion.trim(),
    };

    try {
      if (editandoId) {
        await api.put(`/servicios/${editandoId}`, datos);
      } else {
        await api.post("/servicios", datos);
      }
      setAviso("");
    } catch (err) {
      setConfirmandoGuardar(false);
      setErrores((er) => ({ ...er, general: traducirMsg(err.response?.data?.mensaje) || tr.servicios.errorGuardar }));
      return;
    }

    cerrarModal();
    cargar();
  }

  async function confirmarEliminarServicio() {
    if (!servicioAEliminar) return;
    try {
      await api.delete(`/servicios/${servicioAEliminar.id}`);
      setAviso("");
    } catch (err) {
      setAviso(traducirMsg(err.response?.data?.mensaje) || tr.servicios.errorEliminar);
    }
    setServicioAEliminar(null);
    cargar();
  }

  const columnas = [
    { key: "nombre", label: tr.servicios.colNombre, render: (f) => traducirPlan(f.nombre) },
    { key: "duracion", label: tr.servicios.colDuracion, render: (f) => traducirDuracion(f.duracion) },
    { key: "precio", label: tr.servicios.colPrecio, render: (f) => `$${f.precio}` },
    {
      key: "visibilidad",
      label: tr.serviciosExtra.colVisibilidad,
      render: (f) => {
        const etiquetas = [];
        if (f.es_visita) etiquetas.push(tr.serviciosExtra.visita);
        if (f.visible_clientes) etiquetas.push(tr.serviciosExtra.clientes);
        if (f.visible_recepcion) etiquetas.push(tr.serviciosExtra.recepcion);
        return etiquetas.length ? etiquetas.join(" · ") : tr.serviciosExtra.nadie;
      },
    },
    {
      key: "acciones",
      label: tr.acciones,
      render: (f) => (
        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
          <Boton tamano="sm" variante="outline" onClick={() => abrirEditar(f)}>{tr.editar}</Boton>
          <Boton tamano="sm" variante="peligro" onClick={() => setServicioAEliminar(f)}>{tr.eliminar}</Boton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--c-texto)]">{tr.servicios.titulo}</h1>
        <Boton onClick={abrirNuevo}>{tr.servicios.nuevoBtn}</Boton>
      </div>

      {aviso && <p className="text-sm text-center text-[var(--c-rojo)] mb-3">{aviso}</p>}

      <Table columnas={columnas} filas={servicios} />

      <Modal
        abierto={modalAbierto}
        titulo={editandoId ? tr.servicios.modalEditar : tr.servicios.modalNuevo}
        onClose={cerrarModal}
      >
        <form onSubmit={validarYPedirConfirmacion} noValidate>
          <Input label={tr.servicios.nombre} value={form.nombre} onChange={cambiar("nombre", limpiarTexto)} />
          <Err msg={errores.nombre} />

          <Input
            label={tr.servicios.duracion}
            placeholder={tr.servicios.duracionPlaceholder}
            value={form.duracion}
            onChange={cambiar("duracion", limpiarTexto)}
          />
          <Err msg={errores.duracion} />

          <Input
            label={tr.servicios.precio}
            inputMode="decimal"
            value={form.precio}
            onChange={cambiar("precio", limpiarDecimal)}
          />
          <Err msg={errores.precio} />

          {/* Para quién se ve el servicio y si es la visita (igual que la app) */}
          <div className="space-y-2 mb-3">
            {[
              ["visible_clientes", tr.serviciosExtra.visibleClientes],
              ["visible_recepcion", tr.serviciosExtra.visibleRecepcion],
              ["es_visita", tr.serviciosExtra.esVisita],
            ].map(([campo, etiqueta]) => (
              <label key={campo} className="flex items-center gap-2 text-sm text-[var(--c-texto)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[campo]}
                  onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.checked }))}
                  className="accent-[var(--c-acento)] w-4 h-4"
                />
                {etiqueta}
              </label>
            ))}
            {form.es_visita && <p className="text-xs text-[var(--c-texto-tenue)]">{tr.serviciosExtra.esVisitaNota}</p>}
          </div>
          <Err msg={errores.general} />

          <Boton type="submit" className="w-full mt-2">
            {editandoId ? tr.guardarCambios : tr.servicios.guardarNuevo}
          </Boton>
        </form>
      </Modal>

      {/* Modal de confirmación antes de guardar servicio */}
      <Modal
        abierto={confirmandoGuardar}
        titulo={tr.servicios.confirmarGuardarTitulo}
        onClose={() => setConfirmandoGuardar(false)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {editandoId ? tr.servicios.confirmarEditarMsg : tr.servicios.confirmarCrearMsg}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setConfirmandoGuardar(false)}>
            {tr.cancelar}
          </Boton>
          <Boton className="flex-1" onClick={confirmarGuardarServicio}>
            {tr.confirmar}
          </Boton>
        </div>
      </Modal>

      {/* Modal de confirmación antes de eliminar servicio */}
      <Modal
        abierto={Boolean(servicioAEliminar)}
        titulo={tr.servicios.confirmarEliminarTitulo}
        onClose={() => setServicioAEliminar(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {tr.servicios.confirmarEliminarMsg(servicioAEliminar?.nombre || "")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setServicioAEliminar(null)}>
            {tr.cancelar}
          </Boton>
          <Boton variante="peligro" className="flex-1" onClick={confirmarEliminarServicio}>
            {tr.servicios.confirmarEliminarBtn}
          </Boton>
        </div>
      </Modal>
    </div>
  );
}
