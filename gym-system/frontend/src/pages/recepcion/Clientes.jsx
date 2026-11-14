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
const formVacio = { nombre: "", apellido: "", telefono: "", correo: "", plan: "", metodo: "Efectivo" };

export default function Clientes() {
  const { usuario } = useAuth();
  const { tr, traducirMsg, traducirPlan } = useIdioma();
  const esEncargado = usuario?.rol === "encargado" || usuario?.rol === "dueno";

  const [clientes, setClientes] = useState([]);
  const [fotos, setFotos] = useState({});
  const fotosPedidasRef = useRef(new Set());
  const [planes, setPlanes] = useState([]); // vienen de tipos_membresia activos en Servicios
  const [aviso, setAviso] = useState("");
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
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
  const [clienteADesactivar, setClienteADesactivar] = useState(null);

  // Modal del Encargado: Dar de baja (Suspensión vs Derechos ARCO)
  const [clienteABaja, setClienteABaja] = useState(null);
  const [tipoBaja, setTipoBaja] = useState("suspension"); // "suspension" | "arco"

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

  useEffect(() => {
    cargar();
  }, [buscar, estado]);

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

  async function cargar() {
    const { data } = await api.get("/clientes", { params: { buscar, estado } });
    const lista = data.clientes || [];
    setClientes(lista);

    lista.forEach((c) => {
      if (!fotosPedidasRef.current.has(c.id)) {
        fotosPedidasRef.current.add(c.id);
        api
          .get(`/clientes/${c.id}/foto`)
          .then(({ data: res }) => {
            if (res?.foto) {
              setFotos((prev) => ({ ...prev, [c.id]: res.foto }));
            }
          })
          .catch(() => {});
      }
    });
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
      nombre: cliente.nombre ?? "",
      apellido: cliente.apellido ?? "",
      telefono: cliente.telefono ?? "",
      correo: cliente.correo ?? "",
      plan: cliente.plan ?? "",
      metodo: "Efectivo",
    });
    setErrores({});
    setConfirmandoGuardar(false);
    setModalAbierto(true);
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
    };

    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, datos);
        setAviso("");
      } else {
        const { data } = await api.post("/clientes", datos);
        setAviso(traducirMsg(data.mensaje) || "");
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
      setAviso(traducirMsg(data.mensaje) || tr.clientes.membresiaRenovada);
      setClienteARenovar(null);
      cargar();
    } catch (err) {
      setErrorRenovar(traducirMsg(err.response?.data?.mensaje) || tr.clientes.errorRenovar);
    } finally {
      setProcesandoRenovar(false);
    }
  }

  async function confirmarDesactivarCliente() {
    if (!clienteADesactivar) return;
    try {
      const { data } = await api.put(`/clientes/${clienteADesactivar.id}/desactivar`);
      setAviso(traducirMsg(data.mensaje) || "");
    } catch (err) {
      setAviso(traducirMsg(err.response?.data?.mensaje) || tr.clientes.errorBaja);
    }
    setClienteADesactivar(null);
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
              <Boton variante="outline" className="!px-2.5 !py-1 text-xs" onClick={() => abrirEditar(f)}>
                {tr.editar}
              </Boton>
              <Boton variante="outline" className="!px-2.5 !py-1 text-xs" onClick={() => abrirRostro(f)}>
                {conRostro.has(f.id) ? tr.facial.actualizarRostro : tr.facial.registrarRostro}
              </Boton>
              {esEncargado ? (
                <Boton variante="peligro" className="!px-2.5 !py-1 text-xs" onClick={() => abrirModalBaja(f)}>
                  {tr.darDeBaja}
                </Boton>
              ) : (
                <Boton variante="peligro" className="!px-2.5 !py-1 text-xs" onClick={() => setClienteADesactivar(f)}>
                  {tr.desactivar}
                </Boton>
              )}
            </>
          ) : (
            <>
              <Boton variante="outline" className="!px-2.5 !py-1 text-xs" onClick={() => abrirModalRenovar(f)}>
                {tr.renovar}
              </Boton>
              <Boton variante="outline" className="!px-2.5 !py-1 text-xs" onClick={() => abrirRostro(f)}>
                {conRostro.has(f.id) ? tr.facial.actualizarRostro : tr.facial.registrarRostro}
              </Boton>
              {esEncargado && (
                <Boton variante="peligro" className="!px-2.5 !py-1 text-xs" onClick={() => abrirModalBaja(f)}>
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

      <Table columnas={columnas} filas={clientes} />

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

      {/* Modal de Recepción: Desactivar estatus y retirar plan */}
      <Modal
        abierto={Boolean(clienteADesactivar)}
        titulo={tr.clientes.modalDesactivarTitulo}
        onClose={() => setClienteADesactivar(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {tr.clientes.modalDesactivarMsg(nombreCliente(clienteADesactivar))}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton variante="outline" className="flex-1" onClick={() => setClienteADesactivar(null)}>
            {tr.cancelar}
          </Boton>
          <Boton variante="peligro" className="flex-1" onClick={confirmarDesactivarCliente}>
            {tr.clientes.confirmarDesactivarBtn}
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
