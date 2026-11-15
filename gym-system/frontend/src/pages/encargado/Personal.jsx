import { useEffect, useRef, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";

const campo =
  "bg-[var(--c-campo)] border border-[var(--c-borde)] rounded-md px-3 py-2 text-sm text-[var(--c-texto)] " +
  "placeholder:text-[var(--c-texto-tenue)] focus:outline-none focus:border-[var(--c-acento)] focus:ring-1 focus:ring-[var(--c-acento)]";

// ---------- Validaciones ----------
const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const REGEX_LETRAS = new RegExp(`^[${LETRAS}]+( [${LETRAS}]+)*$`);

const limpiarLetras = (v) =>
  v.replace(new RegExp(`[^${LETRAS} ]`, "g"), "").replace(/^\s+/, "").replace(/\s{2,}/g, " ");
const limpiarTelefono = (v) => v.replace(/\D/g, "").slice(0, 10);
const limpiarEntero = (v) => v.replace(/\D/g, "").slice(0, 4);
const limpiarDecimal = (v) => {
  const s = v.replace(/[^\d.]/g, "");
  const [entero, ...resto] = s.split(".");
  if (resto.length === 0) return entero.slice(0, 7);
  return entero.slice(0, 7) + "." + resto.join("").slice(0, 2);
};

const Err = ({ msg }) =>
  msg ? <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{msg}</p> : null;

// Select con la paleta de la app
function SelectPaleta({ label, value, onChange, options }) {
  return (
    <div className="mb-3">
      <label className="block text-sm text-[var(--c-texto-sec)] mb-1">{label}</label>
      <select value={value} onChange={onChange} className={`w-full ${campo}`}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--c-campo)] text-[var(--c-texto)]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const vacio = { nombre: "", telefono: "", correo: "", password: "", rol: "recepcion", estado: "activo", costoServicio: "", capacidadMaxima: "" };

// PERSONAL del gimnasio: recepcion, instructores y encargados (los clientes van en Clientes)
export default function Personal() {
  const { tr, traducirMsg } = useIdioma();
  const [personal, setPersonal] = useState([]);
  const [fotos, setFotos] = useState({});
  const fotosPedidasRef = useRef(new Set());
  const [aviso, setAviso] = useState("");
  const [buscar, setBuscar] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = creando, id = editando
  const [form, setForm] = useState(vacio);
  const [errores, setErrores] = useState({});

  // Confirmación antes de guardar (crear / editar) y antes de eliminar
  const [confirmandoGuardar, setConfirmandoGuardar] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);

  const vNombre = (v, etiqueta) => {
    const t = v.trim();
    if (!t) return tr.val.esObligatorio(etiqueta);
    if (t.length < 3) return tr.val.minLetras(etiqueta);
    if (!REGEX_LETRAS.test(t)) return tr.val.soloLetras(etiqueta);
    return "";
  };
  const vTelefono = (v) => (!v || /^\d{10}$/.test(v) ? "" : tr.val.telefono10);
  const vCorreo = (v) => {
    const t = v.trim();
    if (!t) return tr.val.correoObligatorio;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? "" : tr.val.correoInvalido;
  };
  const vPassword = (v) => {
    if (!v) return tr.val.passwordObligatoria;
    return v.length >= 8 ? "" : tr.val.passwordMin8;
  };
  const vMonto = (v, etiqueta) => {
    if (v === "" || v == null) return tr.val.esObligatorio(etiqueta);
    const s = String(v);
    if (!/^\d+(\.\d{1,2})?$/.test(s) || Number(s) <= 0) return tr.val.numeroMayorCero(etiqueta);
    return "";
  };
  const vEntero = (v, etiqueta) => {
    if (v === "" || v == null) return tr.val.esObligatorio(etiqueta);
    const s = String(v);
    if (!/^\d+$/.test(s) || Number(s) < 1) return tr.val.enteroMayorCero(etiqueta);
    return "";
  };

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await api.get("/personal");
    const lista = data.personal || [];
    setPersonal(lista);

    lista.forEach((p) => {
      if (!fotosPedidasRef.current.has(p.id)) {
        fotosPedidasRef.current.add(p.id);
        api
          .get(`/personal/${p.id}/foto`)
          .then(({ data: res }) => {
            if (res?.foto) {
              setFotos((prev) => ({ ...prev, [p.id]: res.foto }));
            }
          })
          .catch(() => {});
      }
    });
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

  function abrirEditar(empleado) {
    setEditandoId(empleado.id);
    setForm({
      nombre: empleado.nombre ?? "",
      telefono: empleado.telefono ?? "",
      correo: empleado.correo ?? "",
      password: "",
      rol: empleado.rol ?? "recepcion",
      estado: empleado.estado ?? "activo",
      costoServicio: empleado.costoServicio ?? "",
      capacidadMaxima: empleado.capacidadMaxima ?? "",
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

  // Paso 1: Validar formulario y abrir modal de confirmación
  function validarYPedirConfirmacion(e) {
    e.preventDefault();

    const esInstructor = form.rol === "instructor";
    const errs = {
      nombre: vNombre(form.nombre, tr.personal.nombre),
      telefono: vTelefono(form.telefono),
      correo: vCorreo(form.correo),
      password: editandoId ? "" : vPassword(form.password),
      costoServicio: esInstructor ? vMonto(form.costoServicio, tr.personal.costoServicio) : "",
      capacidadMaxima: esInstructor ? vEntero(form.capacidadMaxima, tr.personal.capacidadMaxima) : "",
    };
    setErrores(errs);
    if (Object.values(errs).some(Boolean)) return;

    setConfirmandoGuardar(true);
  }

  // Paso 2: Ejecutar guardado tras confirmar
  async function confirmarGuardarPersonal() {
    const datos = {
      ...form,
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
    };

    try {
      if (editandoId) {
        // al editar no se manda contraseña
        const { password, ...sinPassword } = datos;
        await api.put(`/personal/${editandoId}`, sinPassword);
        setAviso("");
      } else {
        const { data } = await api.post("/personal", datos);
        setAviso(traducirMsg(data.mensaje) || "");
      }
    } catch (err) {
      setConfirmandoGuardar(false);
      setErrores((er) => ({ ...er, general: traducirMsg(err.response?.data?.mensaje) || tr.personal.errorGuardar }));
      return;
    }

    cerrarModal();
    cargar();
  }

  async function confirmarEliminarPersonal() {
    if (!empleadoAEliminar) return;
    try {
      const { data } = await api.delete(`/personal/${empleadoAEliminar.id}`);
      setAviso(traducirMsg(data.mensaje) || "");
    } catch (err) {
      setAviso(traducirMsg(err.response?.data?.mensaje) || tr.personal.errorEliminar);
    }
    setEmpleadoAEliminar(null);
    cargar();
  }

  const columnas = [
    {
      key: "foto",
      label: tr.personal.colFoto,
      render: (f) => {
        const nombre = (f.nombre || "").trim();
        const inicial = (nombre || "?").charAt(0).toUpperCase();
        const foto = fotos[f.id];
        return (
          <div className="flex items-center justify-center">
            {foto ? (
              <img
                src={foto}
                alt={nombre}
                className="w-9 h-9 shrink-0 rounded-full border border-[var(--c-acento)] object-cover bg-[var(--c-campo)]"
              />
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-full border border-[var(--c-acento)] bg-[var(--c-campo)] flex items-center justify-center text-xs font-bold text-[var(--c-acento)]">
                {inicial}
              </div>
            )}
          </div>
        );
      },
    },
    { key: "nombre", label: tr.personal.colNombre },
    { key: "rol", label: tr.personal.colRol, render: (f) => <span className="capitalize">{tr.roles[f.rol] || f.rol}</span> },
    { key: "correo", label: tr.personal.colCorreo },
    { key: "estado", label: tr.personal.colEstado, render: (f) => <Badge estado={f.estado} /> },
    {
      key: "acciones",
      label: tr.acciones,
      render: (f) => (
        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
          <Boton tamano="sm" variante="outline" onClick={() => abrirEditar(f)}>{tr.editar}</Boton>
          <Boton tamano="sm" variante="peligro" onClick={() => setEmpleadoAEliminar(f)}>{tr.eliminar}</Boton>
        </div>
      ),
    },
  ];

  const personalFiltrado = personal.filter((p) => {
    const q = buscar.trim().toLowerCase();
    const coincideTexto =
      !q ||
      (p.nombre || "").toLowerCase().includes(q) ||
      (p.correo || "").toLowerCase().includes(q);
    const coincideRol = !filtroRol || p.rol === filtroRol;
    const coincideEstado = !filtroEstado || p.estado === filtroEstado;
    return coincideTexto && coincideRol && coincideEstado;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--c-texto)]">{tr.personal.titulo}</h1>
        <Boton onClick={abrirNuevo}>{tr.personal.nuevoBtn}</Boton>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder={tr.personal.buscarPlaceholder}
          className={`flex-1 min-w-[200px] ${campo}`}
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className={campo}
        >
          <option value="">{tr.personal.todosRoles}</option>
          <option value="recepcion">{tr.roles.recepcion}</option>
          <option value="instructor">{tr.roles.instructor}</option>
          <option value="encargado">{tr.roles.encargado}</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={campo}
        >
          <option value="">{tr.todos}</option>
          <option value="activo">{tr.personal.activo}</option>
          <option value="inactivo">{tr.personal.inactivo}</option>
        </select>
      </div>

      {aviso && <p className="text-sm text-center text-[var(--c-ambar-texto)] mb-3">{aviso}</p>}

      <Table columnas={columnas} filas={personalFiltrado} />

      {/* Modal para Agregar / Editar Personal */}
      <Modal
        abierto={modalAbierto}
        titulo={editandoId ? tr.personal.modalEditar : tr.personal.modalNuevo}
        onClose={cerrarModal}
      >
        <form onSubmit={validarYPedirConfirmacion} noValidate>
          <Input label={tr.personal.nombre} value={form.nombre} onChange={cambiar("nombre", limpiarLetras)} />
          <Err msg={errores.nombre} />

          <Input
            label={tr.personal.telefono}
            value={form.telefono}
            inputMode="numeric"
            maxLength={10}
            onChange={cambiar("telefono", limpiarTelefono)}
          />
          <Err msg={errores.telefono} />

          <Input label={tr.personal.correoLogin} type="email" value={form.correo} onChange={cambiar("correo")} />
          <Err msg={errores.correo} />

          {!editandoId && (
            <>
              <Input label={tr.personal.passwordInicial} value={form.password} onChange={cambiar("password")} />
              <Err msg={errores.password} />
            </>
          )}

          <SelectPaleta
            label={tr.personal.rol}
            value={form.rol}
            onChange={cambiar("rol")}
            options={[
              { value: "recepcion", label: tr.roles.recepcion },
              { value: "instructor", label: tr.roles.instructor },
              ...(form.rol === "encargado" ? [{ value: "encargado", label: tr.roles.encargado }] : []),
            ]}
          />
          <SelectPaleta
            label={tr.personal.estado}
            value={form.estado}
            onChange={cambiar("estado")}
            options={[
              { value: "activo", label: tr.personal.activo },
              { value: "inactivo", label: tr.personal.inactivo },
            ]}
          />

          {form.rol === "instructor" && (
            <>
              <Input
                label={tr.personal.costoServicio}
                inputMode="decimal"
                value={form.costoServicio}
                onChange={cambiar("costoServicio", limpiarDecimal)}
              />
              <Err msg={errores.costoServicio} />

              <Input
                label={tr.personal.capacidadMaxima}
                inputMode="numeric"
                value={form.capacidadMaxima}
                onChange={cambiar("capacidadMaxima", limpiarEntero)}
              />
              <Err msg={errores.capacidadMaxima} />
            </>
          )}

          <Err msg={errores.general} />

          <Boton type="submit" className="w-full mt-2">
            {editandoId ? tr.guardarCambios : tr.personal.guardarNuevo}
          </Boton>
        </form>
      </Modal>

      {/* Modal de confirmación antes de guardar personal */}
      <Modal
        abierto={confirmandoGuardar}
        titulo={tr.personal.confirmarGuardarTitulo}
        onClose={() => setConfirmandoGuardar(false)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {editandoId ? tr.personal.confirmarEditarMsg : tr.personal.confirmarCrearMsg}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setConfirmandoGuardar(false)}>
            {tr.cancelar}
          </Boton>
          <Boton className="flex-1" onClick={confirmarGuardarPersonal}>
            {tr.confirmar}
          </Boton>
        </div>
      </Modal>

      {/* Modal de confirmación antes de eliminar personal */}
      <Modal
        abierto={Boolean(empleadoAEliminar)}
        titulo={tr.personal.confirmarEliminarTitulo}
        onClose={() => setEmpleadoAEliminar(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {tr.personal.confirmarEliminarMsg(empleadoAEliminar?.nombre || "")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setEmpleadoAEliminar(null)}>
            {tr.cancelar}
          </Boton>
          <Boton variante="peligro" className="flex-1" onClick={confirmarEliminarPersonal}>
            {tr.personal.confirmarEliminarBtn}
          </Boton>
        </div>
      </Modal>
    </div>
  );
}
