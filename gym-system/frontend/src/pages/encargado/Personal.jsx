import { useEffect, useRef, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import CamposSalud, {
  saludVacia,
  fechaNacimientoValida,
  saludParaEnviar,
} from "../../components/clientes/CamposSalud.jsx";

// Reduce la foto a JPEG de máximo 480 px (las fotos se guardan en base64 en la base)
function fotoAJpeg(archivo) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      const escala = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagen"));
    };
    img.src = url;
  });
}

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

const vacio = {
  nombre: "",
  telefono: "",
  correo: "",
  rol: "recepcion",
  estado: "activo",
  costoServicio: "",
  capacidadMaxima: "",
  salud: saludVacia,
};

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

  // Foto del personal (el Encargado la sube, igual que en la app la toma con la cámara)
  const [fotoNueva, setFotoNueva] = useState("");
  const [cargandoSalud, setCargandoSalud] = useState(false);

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

    // Fotos en lote: GET /personal/fotos?ids=1,2,3 (antes: una petición por persona)
    const faltan = [...new Set(lista.map((p) => p.id))].filter((id) => !fotosPedidasRef.current.has(id));
    for (let i = 0; i < faltan.length; i += 50) {
      const ids = faltan.slice(i, i + 50);
      ids.forEach((id) => fotosPedidasRef.current.add(id));
      try {
        const { data: res } = await api.get("/personal/fotos", { params: { ids: ids.join(",") } });
        if (res?.fotos && Object.keys(res.fotos).length) setFotos((prev) => ({ ...prev, ...res.fotos }));
      } catch {
        ids.forEach((id) => fotosPedidasRef.current.delete(id));
      }
    }
  }

  // Actualiza un campo (limpiando lo inválido) y quita su error
  const cambiar = (nombre, limpiar = (v) => v) => (e) => {
    const valor = limpiar(e.target.value);
    setForm((f) => ({ ...f, [nombre]: valor }));
    setErrores((er) => ({ ...er, [nombre]: "" }));
  };

  function abrirNuevo() {
    setEditandoId(null);
    setFotoNueva("");
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
      rol: empleado.rol ?? "recepcion",
      estado: empleado.estado ?? "activo",
      costoServicio: empleado.costoServicio ?? "",
      capacidadMaxima: empleado.capacidadMaxima ?? "",
      salud: saludVacia,
    });
    setFotoNueva("");
    setErrores({});
    setConfirmandoGuardar(false);
    setModalAbierto(true);

    // Fecha de nacimiento y datos de salud que ya tiene (igual que la app)
    setCargandoSalud(true);
    api
      .get(`/personal/${empleado.id}/salud`)
      .then(({ data }) => setForm((f) => ({ ...f, salud: { ...saludVacia, ...data.salud } })))
      .catch(() => {})
      .finally(() => setCargandoSalud(false));
  }

  async function elegirFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      setFotoNueva(await fotoAJpeg(archivo));
      setErrores((er) => ({ ...er, foto: "" }));
    } catch {
      setErrores((er) => ({ ...er, foto: tr.personalExtra.errorFoto }));
    }
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
      costoServicio: esInstructor ? vMonto(form.costoServicio, tr.personal.costoServicio) : "",
      capacidadMaxima: esInstructor ? vEntero(form.capacidadMaxima, tr.personal.capacidadMaxima) : "",
      // En la app la fecha de nacimiento del personal siempre es obligatoria
      salud_fechaNacimiento: fechaNacimientoValida(form.salud.fechaNacimiento) ? "" : tr.salud.valFecha,
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
      salud: saludParaEnviar(form.salud),
    };

    try {
      let id = editandoId;
      if (editandoId) {
        await api.put(`/personal/${editandoId}`, datos);
        setAviso("");
      } else {
        // Sin contraseña: la base asigna la temporal y el backend manda el correo de bienvenida
        const { data } = await api.post("/personal", datos);
        id = data.id;
        setAviso([data.mensaje, ...(data.avisos || [])].map(traducirMsg).filter(Boolean).join(" "));
      }
      if (fotoNueva && id) {
        try {
          await api.put(`/personal/${id}/foto`, { foto: fotoNueva });
          setFotos((prev) => ({ ...prev, [id]: fotoNueva }));
        } catch (err) {
          setAviso((a) => `${a} ${traducirMsg(err.response?.data?.mensaje) || tr.personalExtra.errorFoto}`.trim());
        }
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
            <p className="text-xs text-[var(--c-texto-sec)] -mt-1 mb-3">{tr.personal.notaCorreoBienvenida}</p>
          )}

          <SelectPaleta
            label={tr.personal.rol}
            value={form.rol}
            onChange={cambiar("rol")}
            options={[
              { value: "recepcion", label: tr.roles.recepcion },
              { value: "instructor", label: tr.roles.instructor },
              { value: "encargado", label: tr.roles.encargado },
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

          {cargandoSalud && <p className="text-xs text-[var(--c-texto-tenue)] mb-3">{tr.salud.cargando}</p>}
          <CamposSalud
            salud={form.salud}
            fechaObligatoria
            errorFecha={errores.salud_fechaNacimiento}
            onChange={(salud) => {
              setForm((f) => ({ ...f, salud }));
              setErrores((er) => ({ ...er, salud_fechaNacimiento: "" }));
            }}
          />

          {/* Foto de perfil */}
          <p className="text-sm font-semibold text-[var(--c-texto)] mt-4 mb-2">{tr.personalExtra.foto}</p>
          <div className="flex items-center gap-3 mb-3">
            {(fotoNueva || (editandoId && fotos[editandoId])) && (
              <img
                src={fotoNueva || fotos[editandoId]}
                alt=""
                className="w-14 h-14 rounded-full border border-[var(--c-acento)] object-cover"
              />
            )}
            <label className="cursor-pointer text-sm px-3 py-1.5 rounded-lg border border-[var(--c-acento)] text-[var(--c-acento)] hover:bg-[var(--c-acento-10)]">
              {tr.personalExtra.elegirFoto}
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={elegirFoto} />
            </label>
          </div>
          <Err msg={errores.foto} />

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
