import { useEffect, useRef, useState } from "react";
import api from "../../api/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Input from "../../components/ui/Input.jsx";
import CamaraFacial from "../../components/facial/CamaraFacial.jsx";
import CancelarMembresia from "../../components/clientes/CancelarMembresia.jsx";
import CamposSalud, {
  saludVacia,
  fechaNacimientoValida,
  saludParaEnviar,
} from "../../components/clientes/CamposSalud.jsx";

const campo =
  "bg-[var(--c-campo)] border border-[var(--c-borde)] rounded-md px-3 py-2 text-sm text-[var(--c-texto)] " +
  "placeholder:text-[var(--c-texto-tenue)] focus:outline-none focus:border-[var(--c-acento)] focus:ring-1 focus:ring-[var(--c-acento)]";

// ---------- Validaciones ----------
const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const REGEX_LETRAS = new RegExp(`^[${LETRAS}]+( [${LETRAS}]+)*$`);

const limpiarLetras = (v) =>
  v.replace(new RegExp(`[^${LETRAS} ]`, "g"), "").replace(/^\s+/, "").replace(/\s{2,}/g, " ");
const limpiarTelefono = (v) => v.replace(/\D/g, "").slice(0, 10);

const Err = ({ msg }) =>
  msg ? <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{msg}</p> : null;

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];
const formVacio = {
  nombre: "",
  apellido: "",
  telefono: "",
  correo: "",
  plan: "",
  metodo: "Efectivo",
  contactoNombre: "",
  contactoTelefono: "",
  salud: saludVacia,
};


// Filas que se pintan de golpe en la tabla (y fotos que se piden por lote)
const POR_PAGINA = 50;

export default function Clientes() {
  const { usuario } = useAuth();
  const { tr, traducirMsg, traducirPlan, esIngles } = useIdioma();
  const esEncargado = usuario?.rol === "encargado" || usuario?.rol === "dueno";

  const [clientes, setClientes] = useState([]);
  const [fotos, setFotos] = useState({});
  const fotosPedidasRef = useRef(new Set());
  const [planes, setPlanes] = useState([]); // vienen de tipos_membresia activos en Servicios
  const [aviso, setAviso] = useState("");
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [buscarDiferido, setBuscarDiferido] = useState(""); // búsqueda que realmente se manda (300 ms después de teclear)
  const [visibles, setVisibles] = useState(POR_PAGINA); // filas que se pintan; el resto con "Mostrar más"
  const peticionRef = useRef(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = creando, id = editando
  const [form, setForm] = useState(formVacio);
  const [errores, setErrores] = useState({});
  const [conRostro, setConRostro] = useState(new Set()); // ids con rostro registrado
  const [rostroDe, setRostroDe] = useState(null); // cliente al que se le registra el rostro
  const [rostroMsg, setRostroMsg] = useState(null); // { tipo: "ok" | "error", texto }

  // Confirmación antes de crear/editar cliente
  const [confirmandoGuardar, setConfirmandoGuardar] = useState(false);

  // Modal de renovación (plan + método de pago + imagen de comprobante si es transferencia)
  const [clienteARenovar, setClienteARenovar] = useState(null);
  const [planRenovar, setPlanRenovar] = useState("");
  const [metodoRenovar, setMetodoRenovar] = useState("Efectivo");
  const [comprobanteRenovar, setComprobanteRenovar] = useState("");
  const [nombreArchivoRenovar, setNombreArchivoRenovar] = useState("");
  const [errorRenovar, setErrorRenovar] = useState("");
  const [procesandoRenovar, setProcesandoRenovar] = useState(false);

  // Modal de Recepción: Desactivar estatus y quitar plan
  const [clienteAReactivar, setClienteAReactivar] = useState(null);

  // Modal del Encargado: Dar de baja (Suspensión vs Derechos ARCO)
  const [clienteABaja, setClienteABaja] = useState(null);
  const [tipoBaja, setTipoBaja] = useState("suspension"); // "suspension" | "arco"

  // Cancelación de membresía (Recepción solicita, el Encargado autoriza en Reportes)
  const [clienteACancelar, setClienteACancelar] = useState(null);
  const [cancelacionPendiente, setCancelacionPendiente] = useState(new Set());
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

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

  // Espera 300 ms sin teclear antes de buscar (antes: 2 peticiones por cada tecla)
  useEffect(() => {
    const t = setTimeout(() => setBuscarDiferido(buscar.trim()), 300);
    return () => clearTimeout(t);
  }, [buscar]);

  useEffect(() => {
    cargarLista();
    setVisibles(POR_PAGINA);
  }, [buscarDiferido, estado]);

  useEffect(() => {
    cargarCancelaciones();
  }, []);

  // Solo se piden las fotos de las filas que se muestran, en una petición por lote
  useEffect(() => {
    cargarFotos(clientes.slice(0, visibles));
  }, [clientes, visibles]);

  useEffect(() => {
    cargarPlanes();
  }, []);

  function cargarPlanes() {
    api
      .get("/clientes/planes")
      .then(({ data }) =>
        setPlanes(
          data.planes.map((p) => ({
            value: p.nombre.toLowerCase(),
            nombre: p.nombre,
            precio: p.precio,
          }))
        )
      )
      .catch(() => setPlanes([]));
  }

  // Se conserva para las llamadas existentes (después de guardar, renovar, dar de baja, etc.)
  function cargar() {
    cargarLista();
    cargarCancelaciones();
  }

  function cargarCancelaciones() {
    api
      .get("/clientes/cancelaciones-pendientes")
      .then(({ data }) => setCancelacionPendiente(new Set(data.ids)))
      .catch(() => {});
  }

  async function cargarLista() {
    peticionRef.current?.abort(); // descarta la respuesta de una búsqueda anterior que llegue tarde
    const ctrl = new AbortController();
    peticionRef.current = ctrl;
    try {
      const { data } = await api.get("/clientes", { params: { buscar: buscarDiferido, estado }, signal: ctrl.signal });
      setClientes(data.clientes || []);
    } catch (err) {
      if (err.code !== "ERR_CANCELED") throw err;
    }
  }

  // Fotos en lote: GET /clientes/fotos?ids=1,2,3 (antes: una petición por cliente y un re-render por foto)
  async function cargarFotos(lista) {
    const faltan = lista.map((c) => c.id).filter((id) => !fotosPedidasRef.current.has(id));
    for (let i = 0; i < faltan.length; i += POR_PAGINA) {
      const ids = faltan.slice(i, i + POR_PAGINA);
      ids.forEach((id) => fotosPedidasRef.current.add(id));
      try {
        const { data } = await api.get("/clientes/fotos", { params: { ids: ids.join(",") } });
        if (data?.fotos && Object.keys(data.fotos).length) setFotos((prev) => ({ ...prev, ...data.fotos }));
      } catch {
        ids.forEach((id) => fotosPedidasRef.current.delete(id)); // se reintenta en la siguiente carga
      }
    }
  }

  // ---------- Rostro (reconocimiento facial) ----------
  async function cargarRostros() {
    try {
      const { data } = await api.get("/clientes/rostros");
      setConRostro(new Set(data.ids));
    } catch {
      setConRostro(new Set());
    }
  }

  useEffect(() => {
    cargarRostros();
  }, []);

  function abrirRostro(cliente) {
    setRostroMsg(null);
    setRostroDe(cliente);
  }

  // Lo llama la camara cuando ya tiene el vector (promedio de 5 muestras del rostro)
  async function guardarRostro(vector, foto) {
    try {
      await api.post(`/clientes/${rostroDe.id}/rostro`, { embedding: vector, foto });
      setRostroMsg({ tipo: "ok", texto: tr.facial.rostroRegistrado });
      if (foto && !fotos[rostroDe.id]) {
        setFotos((prev) => ({
          ...prev,
          [rostroDe.id]: foto.startsWith("data:") ? foto : `data:image/jpeg;base64,${foto}`,
        }));
      }
      cargarRostros();
      setTimeout(() => setRostroDe(null), 1500);
    } catch (err) {
      setRostroMsg({
        tipo: "error",
        texto: traducirMsg(err.response?.data?.mensaje) || tr.facial.errorRegistrarRostro,
      });
      throw err; // la camara deja intentar de nuevo
    }
  }

  // Actualiza un campo (limpiando lo inválido) y quita su error
  const cambiar = (nombre, limpiar = (v) => v) => (e) => {
    const valor = limpiar(e.target.value);
    setForm((f) => ({ ...f, [nombre]: valor }));
    setErrores((er) => ({ ...er, [nombre]: "" }));
  };

  function abrirNuevo() {
    cargarPlanes();
    setEditandoId(null);
    setForm(formVacio);
    setErrores({});
    setConfirmandoGuardar(false);
    setModalAbierto(true);
  }

  function abrirEditar(cliente) {
    setEditandoId(cliente.id);
    setForm({
      ...formVacio,
      nombre: cliente.nombre ?? "",
      apellido: cliente.apellido ?? "",
      telefono: cliente.telefono ?? "",
      correo: cliente.correo ?? "",
      plan: cliente.plan ?? "",
    });
    setErrores({});
    setConfirmandoGuardar(false);
    setModalAbierto(true);

    // Al editar se cargan el contacto de emergencia y los datos de salud que ya tiene (igual que la app)
    setCargandoDetalle(true);
    api
      .get(`/clientes/${cliente.id}/detalle`)
      .then(({ data }) =>
        setForm((f) => ({
          ...f,
          contactoNombre: data.contacto?.nombre || "",
          contactoTelefono: data.contacto?.telefono || "",
          salud: { ...saludVacia, ...data.salud },
        }))
      )
      .catch(() => {})
      .finally(() => setCargandoDetalle(false));
  }


  function cerrarModal() {
    setModalAbierto(false);
    setEditandoId(null);
    setForm(formVacio);
    setErrores({});
    setConfirmandoGuardar(false);
  }

  // Paso 1: Validar formulario y pedir confirmación
  function validarYPedirConfirmacion(e) {
    e.preventDefault();

    const errs = {
      nombre: vNombre(form.nombre, tr.clientes.nombre),
      apellido: vNombre(form.apellido, tr.clientes.apellido),
      telefono: vTelefono(form.telefono),
      correo: vCorreo(form.correo),
      plan: editandoId || form.plan ? "" : tr.val.seleccionaPlan,
      // Contacto de emergencia obligatorio (igual que la app y la base)
      contactoNombre:
        form.contactoNombre.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "").length >= 3 ? "" : tr.salud.valContactoNombre,
      contactoTelefono: /^\d{10}$/.test(form.contactoTelefono) ? "" : tr.salud.valContactoTelefono,
      // Fecha de nacimiento obligatoria al registrar; al editar, si hay una, debe ser válida
      salud_fechaNacimiento:
        (!editandoId || form.salud.fechaNacimiento) && !fechaNacimientoValida(form.salud.fechaNacimiento)
          ? tr.salud.valFecha
          : "",
    };
    setErrores(errs);
    if (Object.values(errs).some(Boolean)) return;

    setConfirmandoGuardar(true);
  }

  // Paso 2: Ejecutar guardado tras confirmar
  async function confirmarGuardarCliente() {
    const datos = {
      ...form,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      correo: form.correo.trim(),
      contactoNombre: form.contactoNombre.trim(),
      salud: saludParaEnviar(form.salud),
    };

    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, datos);
        setAviso("");
      } else {
        const { data } = await api.post("/clientes", datos);
        setAviso([data.mensaje, ...(data.avisos || [])].map(traducirMsg).filter(Boolean).join(" "));
      }
    } catch (err) {
      setConfirmandoGuardar(false);
      setErrores((er) => ({ ...er, general: traducirMsg(err.response?.data?.mensaje) || tr.clientes.errorGuardar }));
      return;
    }

    cerrarModal();
    cargar();
  }

  function abrirModalRenovar(cliente) {
    cargarPlanes();
    setClienteARenovar(cliente);
    const planActual = (cliente.plan || "").toLowerCase();
    const existePlan = planes.some((p) => p.value === planActual && p.value !== "visita");
    const sugerido = existePlan
      ? planActual
      : planes.find((p) => p.value !== "visita")?.value || planes[0]?.value || "";
    setPlanRenovar(sugerido);
    setMetodoRenovar("Efectivo");
    setComprobanteRenovar("");
    setNombreArchivoRenovar("");
    setErrorRenovar("");
  }

  function seleccionarImagenComprobante(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setNombreArchivoRenovar(archivo.name);
    setErrorRenovar("");
    const reader = new FileReader();
    reader.onload = () => {
      setComprobanteRenovar(String(reader.result || ""));
    };
    reader.readAsDataURL(archivo);
  }

  async function confirmarRenovacion() {
    if (!clienteARenovar) return;
    if (!planRenovar) {
      setErrorRenovar(tr.val.seleccionaPlan);
      return;
    }
    if (metodoRenovar === "Transferencia" && !comprobanteRenovar) {
      setErrorRenovar(tr.clientes.faltaComprobante);
      return;
    }

    setProcesandoRenovar(true);
    try {
      const { data } = await api.put(`/clientes/${clienteARenovar.id}/renovar`, {
        plan: planRenovar,
        metodo: metodoRenovar,
        comprobante: metodoRenovar === "Transferencia" ? comprobanteRenovar : undefined,
      });
      setAviso(
        [traducirMsg(data.mensaje) || tr.clientes.membresiaRenovada, ...(data.avisos || []).map(traducirMsg)].join(" ")
      );
      setClienteARenovar(null);
      cargar();
    } catch (err) {
      setErrorRenovar(traducirMsg(err.response?.data?.mensaje) || tr.clientes.errorRenovar);
    } finally {
      setProcesandoRenovar(false);
    }
  }

  // Solo Encargado: vuelve a activar una cuenta dada de baja (igual que la app)
  async function confirmarReactivarCliente() {
    if (!clienteAReactivar) return;
    try {
      const { data } = await api.put(`/clientes/${clienteAReactivar.id}/estado`, { activo: true });
      setAviso(traducirMsg(data.mensaje) || "");
    } catch (err) {
      setAviso(traducirMsg(err.response?.data?.mensaje) || tr.clientes.errorReactivar);
    }
    setClienteAReactivar(null);
    cargar();
  }

  function abrirModalBaja(cliente) {
    setClienteABaja(cliente);
    setTipoBaja(cliente.estado === "activo" ? "suspension" : "arco");
  }

  async function confirmarBajaEncargado() {
    if (!clienteABaja) return;
    try {
      const { data } = await api.delete(`/clientes/${clienteABaja.id}`, {
        params: { tipo: tipoBaja },
      });
      setAviso(traducirMsg(data.mensaje) || "");
    } catch (err) {
      setAviso(traducirMsg(err.response?.data?.mensaje) || tr.clientes.errorBaja);
    }
    setClienteABaja(null);
    cargar();
  }

  const nombreCliente = (c) => `${c?.nombre ?? ""} ${c?.apellido ?? ""}`.trim();

  const columnas = [
    {
      key: "foto",
      label: tr.clientes.colFoto,
      render: (f) => {
        const nombreCompleto = nombreCliente(f);
        const inicial = (nombreCompleto || "?").charAt(0).toUpperCase();
        const foto = fotos[f.id];
        return (
          <div className="flex items-center justify-center">
            {foto ? (
              <img
                src={foto}
                alt={nombreCompleto}
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
    {
      key: "nombre",
      label: tr.clientes.colNombre,
      render: (f) => nombreCliente(f),
    },
    {
      key: "numMembresia",
      label: tr.clientes.colMembresia,
      render: (f) => <span className="whitespace-nowrap">{f.numMembresia}</span>,
    },
    {
      key: "plan",
      label: tr.clientes.colPlan,
      render: (f) =>
        f.plan ? (
          <span className="capitalize whitespace-nowrap">{traducirPlan(f.plan)}</span>
        ) : (
          <span className="text-xs text-[var(--c-texto-tenue)] whitespace-nowrap">{tr.clientes.sinPlan}</span>
        ),
    },
    {
      key: "fechaRegistro",
      label: tr.clientes.colFechaRegistro,
      render: (f) => <span className="whitespace-nowrap">{f.fechaRegistro}</span>,
    },
    { key: "estado", label: tr.clientes.colEstado, render: (f) => <Badge estado={f.estado} /> },
    {
      key: "rostro",
      label: tr.facial.colRostro,
      render: (f) =>
        conRostro.has(f.id) ? (
          <span className="text-[var(--c-verde-texto)] font-bold whitespace-nowrap">✓ {tr.facial.registrado}</span>
        ) : (
          <span className="text-[var(--c-texto-tenue)] whitespace-nowrap">{tr.facial.sinRostro}</span>
        ),
    },
    {
      key: "acciones",
      label: tr.acciones,
      render: (f) => (
        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
          {f.estado === "activo" ? (
            <>
              <Boton tamano="sm" variante="outline" onClick={() => abrirEditar(f)}>
                {tr.editar}
              </Boton>
              <Boton tamano="sm" variante="outline" onClick={() => abrirRostro(f)}>
                {conRostro.has(f.id) ? tr.facial.actualizarRostro : tr.facial.registrarRostro}
              </Boton>
              {cancelacionPendiente.has(f.id) ? (
                <span className="px-2 py-1 rounded-lg border border-[var(--c-rojo)] text-[var(--c-rojo)] text-xs">
                  {tr.cancelacion.pendiente}
                </span>
              ) : (
                <Boton tamano="sm" variante="outline" onClick={() => setClienteACancelar(f)}>
                  {tr.cancelacion.boton}
                </Boton>
              )}
              {esEncargado && (
                <Boton tamano="sm" variante="peligro" onClick={() => abrirModalBaja(f)}>
                  {tr.darDeBaja}
                </Boton>
              )}
            </>
          ) : (
            <>
              {/* Editar siempre está disponible, aunque el plan no esté vigente (igual que la app) */}
              <Boton tamano="sm" variante="outline" onClick={() => abrirEditar(f)}>
                {tr.editar}
              </Boton>
              <Boton tamano="sm" variante="outline" onClick={() => abrirModalRenovar(f)}>
                {tr.renovar}
              </Boton>
              <Boton tamano="sm" variante="outline" onClick={() => abrirRostro(f)}>
                {conRostro.has(f.id) ? tr.facial.actualizarRostro : tr.facial.registrarRostro}
              </Boton>
              {esEncargado && f.estadoCuenta !== "activo" && (
                <Boton tamano="sm" variante="exito" onClick={() => setClienteAReactivar(f)}>
                  {tr.clientes.reactivar}
                </Boton>
              )}
              {esEncargado && (
                <Boton tamano="sm" variante="peligro" onClick={() => abrirModalBaja(f)}>
                  {tr.darDeBaja}
                </Boton>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--c-texto)]">{tr.clientes.titulo}</h1>
        <Boton onClick={abrirNuevo}>{tr.clientes.nuevoBtn}</Boton>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder={tr.clientes.buscarPlaceholder}
          className={`flex-1 ${campo}`}
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={campo}
        >
          <option value="">{tr.todos}</option>
          <option value="activo">{tr.clientes.activo}</option>
          <option value="inactivo">{tr.clientes.inactivo}</option>
        </select>
      </div>

      {aviso && <p className="text-sm text-center text-[var(--c-ambar-texto)] mb-3">{aviso}</p>}

      <Table columnas={columnas} filas={clientes.slice(0, visibles)} />
      {clientes.length > visibles && (
        <div className="mt-3 flex justify-center">
          <Boton variante="outline" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
            {esIngles ? "Show more" : "Mostrar más"} ({clientes.length - visibles})
          </Boton>
        </div>
      )}

      {/* Modal para Crear / Editar Cliente */}
      <Modal
        abierto={modalAbierto}
        titulo={editandoId ? tr.clientes.modalEditar : tr.clientes.modalNuevo}
        onClose={cerrarModal}
      >
        <form onSubmit={validarYPedirConfirmacion} noValidate>
          <Input label={tr.clientes.nombre} value={form.nombre} onChange={cambiar("nombre", limpiarLetras)} />
          <Err msg={errores.nombre} />

          <Input label={tr.clientes.apellido} value={form.apellido} onChange={cambiar("apellido", limpiarLetras)} />
          <Err msg={errores.apellido} />

          <Input
            label={tr.clientes.telefono}
            value={form.telefono}
            inputMode="numeric"
            maxLength={10}
            onChange={cambiar("telefono", limpiarTelefono)}
          />
          <Err msg={errores.telefono} />

          <Input label={tr.clientes.correo} type="email" value={form.correo} onChange={cambiar("correo")} />
          <Err msg={errores.correo} />

          {cargandoDetalle && <p className="text-xs text-[var(--c-texto-tenue)] mb-3">{tr.salud.cargando}</p>}

          {/* Contacto de emergencia (obligatorio) */}
          <p className="text-sm font-semibold text-[var(--c-texto)] mt-4 mb-2">{tr.salud.contactoTitulo}</p>
          <Input
            label={tr.salud.contactoNombre}
            value={form.contactoNombre}
            onChange={cambiar("contactoNombre", limpiarLetras)}
          />
          <Err msg={errores.contactoNombre} />
          <Input
            label={tr.salud.contactoTelefono}
            value={form.contactoTelefono}
            inputMode="numeric"
            maxLength={10}
            onChange={cambiar("contactoTelefono", limpiarTelefono)}
          />
          <Err msg={errores.contactoTelefono} />

          {/* Fecha de nacimiento y datos de salud (solo Recepción y Encargado) */}
          <CamposSalud
            salud={form.salud}
            fechaObligatoria={!editandoId}
            errorFecha={errores.salud_fechaNacimiento}
            onChange={(salud) => {
              setForm((f) => ({ ...f, salud }));
              setErrores((er) => ({ ...er, salud_fechaNacimiento: "" }));
            }}
          />

          {!editandoId && (
            <>
              <div className="mb-3">
                <label className="block text-sm text-[var(--c-texto-sec)] mb-1">{tr.clientes.plan}</label>
                <select
                  value={form.plan}
                  onChange={cambiar("plan")}
                  className={`w-full ${campo} ${form.plan ? "text-[var(--c-texto)]" : "text-[var(--c-texto-tenue)]"}`}
                >
                  <option value="" disabled className="bg-[var(--c-campo)] text-[var(--c-texto-tenue)]">
                    {tr.clientes.seleccionaPlan}
                  </option>
                  {planes.map((p) => (
                    <option key={p.value} value={p.value} className="bg-[var(--c-campo)] text-[var(--c-texto)]">
                      {`${traducirPlan(p.nombre)} · $${p.precio}`}
                    </option>
                  ))}
                </select>
              </div>
              <Err msg={errores.plan} />

              <div className="mb-3">
                <label className="block text-sm text-[var(--c-texto-sec)] mb-1">{tr.clientes.metodoPago}</label>
                <select
                  value={form.metodo}
                  onChange={cambiar("metodo")}
                  className={`w-full ${campo}`}
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m} className="bg-[var(--c-campo)] text-[var(--c-texto)]">
                      {tr.clientes.metodos[m] || m}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Err msg={errores.general} />

          <Boton type="submit" className="w-full mt-2">
            {editandoId ? tr.guardarCambios : tr.clientes.guardarNuevo}
          </Boton>
        </form>
      </Modal>

      {/* Modal de confirmación antes de guardar cliente */}
      <Modal
        abierto={confirmandoGuardar}
        titulo={tr.clientes.confirmarGuardarTitulo}
        onClose={() => setConfirmandoGuardar(false)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {editandoId ? tr.clientes.confirmarEditarMsg : tr.clientes.confirmarCrearMsg}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setConfirmandoGuardar(false)}>
            {tr.cancelar}
          </Boton>
          <Boton className="flex-1" onClick={confirmarGuardarCliente}>
            {tr.confirmar}
          </Boton>
        </div>
      </Modal>

      {/* Modal de Renovación con Plan, Método de pago y Subida de Comprobante */}
      <Modal
        abierto={Boolean(clienteARenovar)}
        titulo={tr.clientes.modalRenovar}
        onClose={() => !procesandoRenovar && setClienteARenovar(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-4">
          {tr.clientes.confirmarRenovarMsg(nombreCliente(clienteARenovar))}
        </p>

        <div className="mb-3">
          <label className="block text-sm text-[var(--c-texto-sec)] mb-1">{tr.clientes.plan}</label>
          <select
            value={planRenovar}
            onChange={(e) => {
              setPlanRenovar(e.target.value);
              setErrorRenovar("");
            }}
            className={`w-full ${campo}`}
          >
            <option value="" disabled className="bg-[var(--c-campo)] text-[var(--c-texto-tenue)]">
              {tr.clientes.seleccionaPlan}
            </option>
            {planes.map((p) => (
              <option key={p.value} value={p.value} className="bg-[var(--c-campo)] text-[var(--c-texto)]">
                {`${traducirPlan(p.nombre)} · $${p.precio}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm text-[var(--c-texto-sec)] mb-1">{tr.clientes.metodoPago}</label>
          <select
            value={metodoRenovar}
            onChange={(e) => {
              setMetodoRenovar(e.target.value);
              setErrorRenovar("");
            }}
            className={`w-full ${campo}`}
          >
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m} className="bg-[var(--c-campo)] text-[var(--c-texto)]">
                {tr.clientes.metodos[m] || m}
              </option>
            ))}
          </select>
        </div>

        {metodoRenovar === "Transferencia" && (
          <div className="mb-3">
            <label className="block text-sm text-[var(--c-texto-sec)] mb-1">
              {tr.clientes.comprobanteLabel}
            </label>
            <label className="flex flex-col items-center justify-center w-full border border-dashed border-[var(--c-acento)] rounded-lg p-3 cursor-pointer bg-[var(--c-campo)] hover:bg-[var(--c-borde-20)] transition-colors text-center">
              <span className="text-xs font-medium text-[var(--c-acento)]">
                {comprobanteRenovar ? tr.clientes.cambiarComprobante : tr.clientes.subirComprobante}
              </span>
              {nombreArchivoRenovar && (
                <span className="text-[11px] text-[var(--c-texto-sec)] mt-1 truncate max-w-full">
                  {nombreArchivoRenovar}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={seleccionarImagenComprobante}
                className="hidden"
              />
            </label>

            {comprobanteRenovar && (
              <div className="mt-2 rounded-lg overflow-hidden border border-[var(--c-borde)] bg-[var(--c-fondo)] max-h-44 flex items-center justify-center">
                <img
                  src={comprobanteRenovar}
                  alt="Vista previa del comprobante"
                  className="max-h-44 object-contain"
                />
              </div>
            )}

            <p className="text-xs text-center text-[var(--c-ambar-texto)] mt-2">
              {tr.clientes.avisoTransferencia}
            </p>
          </div>
        )}

        <Err msg={errorRenovar} />

        <div className="flex items-center justify-center gap-3 mt-4">
          <Boton
            variante="outline"
            className="flex-1"
            disabled={procesandoRenovar}
            onClick={() => setClienteARenovar(null)}
          >
            {tr.cancelar}
          </Boton>
          <Boton
            variante="exito"
            className="flex-1"
            disabled={procesandoRenovar}
            onClick={confirmarRenovacion}
          >
            {tr.clientes.confirmarRenovarBtn}
          </Boton>
        </div>
      </Modal>

      {clienteACancelar && (
        <CancelarMembresia
          cliente={clienteACancelar}
          nombre={nombreCliente(clienteACancelar)}
          onCerrar={() => setClienteACancelar(null)}
          onListo={(msg) => {
            setClienteACancelar(null);
            setAviso(msg);
            cargar();
          }}
        />
      )}

      {/* Modal del Encargado: Reactivar una cuenta dada de baja */}
      <Modal
        abierto={Boolean(clienteAReactivar)}
        titulo={tr.clientes.modalReactivarTitulo}
        onClose={() => setClienteAReactivar(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {tr.clientes.modalReactivarMsg(nombreCliente(clienteAReactivar))}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setClienteAReactivar(null)}>
            {tr.cancelar}
          </Boton>
          <Boton variante="exito" className="flex-1" onClick={confirmarReactivarCliente}>
            {tr.clientes.confirmarReactivarBtn}
          </Boton>
        </div>
      </Modal>

      {/* Modal del Encargado: Dar de baja (Suspensión vs Derechos ARCO) */}
      <Modal
        abierto={Boolean(clienteABaja)}
        titulo={tr.clientes.modalBajaTitulo}
        onClose={() => setClienteABaja(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-4">
          {tr.clientes.modalBajaSubtitulo(nombreCliente(clienteABaja))}
        </p>

        <div className="space-y-3 mb-5">
          {clienteABaja?.estado === "activo" && (
            <label
              className={`block rounded-lg border p-3 cursor-pointer transition-colors ${
                tipoBaja === "suspension"
                  ? "border-[var(--c-acento)] bg-[var(--c-acento-15)]"
                  : "border-[var(--c-borde)] bg-[var(--c-campo)]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="tipoBaja"
                  value="suspension"
                  checked={tipoBaja === "suspension"}
                  onChange={() => setTipoBaja("suspension")}
                  className="mt-1 accent-[var(--c-acento)]"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--c-texto)]">
                    {tr.clientes.bajaOpcionSuspensionTitulo}
                  </p>
                  <p className="text-xs text-[var(--c-texto-sec)] mt-1 leading-relaxed">
                    {tr.clientes.bajaOpcionSuspensionDesc}
                  </p>
                </div>
              </div>
            </label>
          )}

          <label
            className={`block rounded-lg border p-3 cursor-pointer transition-colors ${
              tipoBaja === "arco"
                ? "border-[var(--c-rojo)] bg-[var(--c-rojo-10)]"
                : "border-[var(--c-borde)] bg-[var(--c-campo)]"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="tipoBaja"
                value="arco"
                checked={tipoBaja === "arco"}
                onChange={() => setTipoBaja("arco")}
                className="mt-1 accent-[var(--c-rojo)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--c-rojo)]">
                  {tr.clientes.bajaOpcionArcoTitulo}
                </p>
                <p className="text-xs text-[var(--c-texto-sec)] mt-1 leading-relaxed">
                  {tr.clientes.bajaOpcionArcoDesc}
                </p>
              </div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setClienteABaja(null)}>
            {tr.cancelar}
          </Boton>
          <Boton variante="peligro" className="flex-1" onClick={confirmarBajaEncargado}>
            {tr.clientes.confirmarBajaBtn}
          </Boton>
        </div>
      </Modal>

      {/* Registro de rostro: se monta solo mientras esta abierto, asi la camara se apaga al cerrar */}
      <Modal
        abierto={!!rostroDe}
        titulo={`${tr.facial.registrarRostro}: ${rostroDe ? nombreCliente(rostroDe) : ""}`}
        onClose={() => setRostroDe(null)}
      >
        <p className="text-sm text-[var(--c-texto-sec)] mb-4">{tr.facial.instruccionRegistro}</p>
        {rostroMsg && (
          <p
            className={`mb-3 rounded-lg border px-4 py-2.5 text-center text-sm font-bold ${
              rostroMsg.tipo === "ok"
                ? "border-[var(--c-verde)] bg-[var(--c-verde-bg)] text-[var(--c-verde-texto)]"
                : "border-[var(--c-rojo)] bg-[var(--c-rojo-bg)] text-[var(--c-rojo-texto)]"
            }`}
          >
            {rostroMsg.texto}
          </p>
        )}
        {rostroDe && (
          <CamaraFacial
            key={rostroDe.id}
            muestrasNecesarias={5}
            modo="unico"
            encenderAlAbrir
            onRostro={guardarRostro}
          />
        )}
      </Modal>
    </div>
  );
}
