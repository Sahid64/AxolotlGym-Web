import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";

const tarjeta = "bg-[var(--c-tarjeta)] border border-[var(--c-borde)] rounded-lg p-6";
const ID_LECTOR = "lector-qr";

// El QR de la app trae "AXOLOTL-GYM|ACCESO|M-1001": nos quedamos con el ultimo pedazo.
function extraerMembresia(texto) {
  const partes = String(texto).trim().split("|");
  return partes[partes.length - 1].trim();
}

const formatearHora = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";

export default function EscanearQR() {
  const { tr, traducirMsg } = useIdioma();
  const [cliente, setCliente] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }
  const [estadoCamara, setEstadoCamara] = useState("apagada"); // apagada | iniciando | activa | error

  // Clientes actualmente dentro del gimnasio y modal para sacar manualmente
  const [clientesDentro, setClientesDentro] = useState([]);
  const [fotos, setFotos] = useState({});
  const fotosPedidasRef = useRef(new Set());
  const [clienteASacar, setClienteASacar] = useState(null);
  const [procesandoSalida, setProcesandoSalida] = useState(false);

  const scannerRef = useRef(null);
  const ultimoRef = useRef({ codigo: "", t: 0 });

  useEffect(() => {
    cargarDentro();
    const intervalo = setInterval(cargarDentro, 5000);
    return () => {
      clearInterval(intervalo);
      detenerCamara();
    };
  }, []);

  // El aviso se quita solo; si fue un registro exitoso tambien se limpia la tarjeta del cliente
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => {
      if (aviso.tipo === "ok") setCliente(null);
      setAviso(null);
    }, 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  function pedirFotoCliente(id) {
    if (!id || fotosPedidasRef.current.has(id)) return;
    fotosPedidasRef.current.add(id);
    api
      .get(`/clientes/${id}/foto`)
      .then(({ data: res }) => {
        if (res?.foto) {
          setFotos((prev) => ({ ...prev, [id]: res.foto }));
        }
      })
      .catch(() => {});
  }

  async function cargarDentro() {
    try {
      const { data } = await api.get("/qr/dentro");
      const lista = data.clientes || [];
      setClientesDentro(lista);
      lista.forEach((c) => pedirFotoCliente(c.id));
    } catch {
      /* mantener lista previa si falla momentaneamente */
    }
  }

  async function confirmarSalidaManual() {
    if (!clienteASacar) return;
    setProcesandoSalida(true);
    try {
      const { data } = await api.post("/qr/salida-manual", {
        clienteId: clienteASacar.id,
      });
      setAviso({
        tipo: "ok",
        texto: traducirMsg(data.mensaje) || tr.qr.salidaRegistrada,
      });
      setClienteASacar(null);
      await cargarDentro();
    } catch (err) {
      setAviso({
        tipo: "error",
        texto: traducirMsg(err.response?.data?.mensaje) || tr.qr.errorRegistrar,
      });
      setClienteASacar(null);
    } finally {
      setProcesandoSalida(false);
    }
  }

  async function iniciarCamara() {
    setEstadoCamara("iniciando");
    // Primero la camara trasera (celulares); si no hay, cualquiera (laptops)
    for (const modo of [{ facingMode: "environment" }, { facingMode: "user" }]) {
      try {
        const scanner = new Html5Qrcode(ID_LECTOR);
        scannerRef.current = scanner;
        await scanner.start(
          modo,
          { fps: 10, aspectRatio: 1 },
          (texto) => procesarCodigo(texto),
          () => {} // se llama en cada cuadro sin QR; se ignora
        );
        setEstadoCamara("activa");
        return;
      } catch {
        await detenerCamara();
      }
    }
    setEstadoCamara("error");
  }

  async function detenerCamara() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      /* ya estaba apagada */
    }
  }

  async function apagarCamara() {
    await detenerCamara();
    setEstadoCamara("apagada");
  }

  // Evita procesar el mismo QR muchas veces seguidas mientras la camara lo sigue viendo
  function procesarCodigo(texto) {
    const codigo = extraerMembresia(texto);
    const ahora = Date.now();
    if (ultimoRef.current.codigo === codigo && ahora - ultimoRef.current.t < 3000) return;
    ultimoRef.current = { codigo, t: ahora };
    buscarCliente(codigo);
  }

  async function buscarCliente(codigo) {
    setAviso(null);
    try {
      const { data } = await api.get("/clientes", { params: { buscar: codigo } });
      const encontrado = data.clientes.find(
        (c) =>
          String(c.numMembresia).toLowerCase() === codigo.toLowerCase() ||
          String(c.codigoQr || "").toLowerCase() === codigo.toLowerCase()
      );
      if (!encontrado) {
        setCliente(null);
        setAviso({ tipo: "error", texto: tr.qr.codigoNoReconocido });
      } else {
        setCliente(encontrado);
        pedirFotoCliente(encontrado.id);
      }
    } catch {
      setCliente(null);
      setAviso({ tipo: "error", texto: tr.qr.errorConsulta });
    }
  }

  async function registrar(tipo) {
    if (!cliente) return;
    if (cliente.estado !== "activo") {
      setAviso({ tipo: "error", texto: tr.qr.membresiaVencida });
      return;
    }
    try {
      const { data } = await api.post("/qr/registrar", {
        numMembresia: cliente.numMembresia,
        tipo, // "entrada" | "salida"
      });
      setAviso({
        tipo: "ok",
        texto: traducirMsg(data.mensaje) || (tipo === "entrada" ? tr.qr.entradaRegistrada : tr.qr.salidaRegistrada),
      });
      await cargarDentro();
    } catch (err) {
      setAviso({ tipo: "error", texto: traducirMsg(err.response?.data?.mensaje) || tr.qr.errorRegistrar });
    }
  }

  const inicial = cliente?.nombre?.trim().charAt(0).toUpperCase();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--c-texto)]">{tr.qr.titulo}</h1>
        <span className="px-3.5 py-1 rounded-full border border-[var(--c-acento)] bg-[var(--c-acento-15)] text-sm font-bold text-[var(--c-acento)]">
          {tr.qr.dentroBadge(clientesDentro.length)}
        </span>
      </div>

      {/* ---------- Sección: Clientes actualmente dentro del gimnasio (salida manual) ---------- */}
      <div className={`${tarjeta} mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[var(--c-texto)]">{tr.qr.dentroTitulo}</p>
          <Boton variante="outline" onClick={cargarDentro}>
            {tr.qr.actualizarLista}
          </Boton>
        </div>

        {clientesDentro.length === 0 ? (
          <p className="text-sm text-center text-[var(--c-texto-tenue)] py-6">
            {tr.qr.sinClientesDentro}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {clientesDentro.map((c) => {
              const ini = (c.nombre || "?").trim().charAt(0).toUpperCase();
              const foto = fotos[c.id];
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--c-borde)] bg-[var(--c-campo)] p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {foto ? (
                      <img
                        src={foto}
                        alt={c.nombre}
                        className="w-10 h-10 shrink-0 rounded-full border border-[var(--c-acento)] object-cover bg-[var(--c-fondo)]"
                      />
                    ) : (
                      <div className="w-10 h-10 shrink-0 rounded-full border border-[var(--c-acento)] bg-[var(--c-fondo)] flex items-center justify-center text-sm font-bold text-[var(--c-acento)]">
                        {ini}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--c-texto)] truncate">{c.nombre}</p>
                      <p className="text-xs text-[var(--c-texto-sec)]">
                        {c.numMembresia}
                        {c.desde ? ` · ${tr.qr.desdeHora(formatearHora(c.desde))}` : ""}
                      </p>
                    </div>
                  </div>
                  <Boton
                    variante="peligro"
                    className="shrink-0 text-xs"
                    onClick={() => setClienteASacar(c)}
                  >
                    {tr.qr.sacarManualBtn}
                  </Boton>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ---------- Camara ---------- */}
        <div className={tarjeta}>
          <p className="text-sm font-medium text-center text-[var(--c-texto)] mb-4">{tr.qr.escanearCodigo}</p>

          <div className="relative aspect-square rounded-lg overflow-hidden bg-[var(--c-campo)] mb-4">
            <div
              id={ID_LECTOR}
              className="absolute inset-0 [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"
            />

            {estadoCamara !== "activa" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--c-texto-tenue)]">
                {estadoCamara === "iniciando" && <p>{tr.qr.abriendoCamara}</p>}
                {estadoCamara === "apagada" && (
                  <>
                    <p>{tr.qr.camaraApagada}</p>
                    <Boton onClick={iniciarCamara}>{tr.qr.encenderCamara}</Boton>
                  </>
                )}
                {estadoCamara === "error" && (
                  <>
                    <p>{tr.qr.errorCamara}</p>
                    <Boton variante="outline" onClick={iniciarCamara}>{tr.qr.reintentar}</Boton>
                  </>
                )}
              </div>
            )}

            <span className="pointer-events-none absolute top-3 left-3 w-9 h-9 border-t-4 border-l-4 border-[var(--c-acento)] rounded-tl-lg" />
            <span className="pointer-events-none absolute top-3 right-3 w-9 h-9 border-t-4 border-r-4 border-[var(--c-acento)] rounded-tr-lg" />
            <span className="pointer-events-none absolute bottom-3 left-3 w-9 h-9 border-b-4 border-l-4 border-[var(--c-acento)] rounded-bl-lg" />
            <span className="pointer-events-none absolute bottom-3 right-3 w-9 h-9 border-b-4 border-r-4 border-[var(--c-acento)] rounded-br-lg" />
          </div>

          {estadoCamara === "activa" && (
            <Boton variante="outline" className="w-full" onClick={apagarCamara}>
              {tr.qr.apagarCamara}
            </Boton>
          )}
        </div>

        {/* ---------- Informacion del cliente ---------- */}
        <div className={tarjeta}>
          <p className="text-sm font-medium text-center text-[var(--c-texto)]">{tr.qr.infoCliente}</p>
          <div className="my-4 h-px bg-[var(--c-borde-suave)]" />

          {!cliente ? (
            <p className="text-sm text-[var(--c-texto-tenue)] text-center py-10">
              {tr.qr.instruccionEscaneo}
            </p>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              {fotos[cliente.id] ? (
                <img
                  src={fotos[cliente.id]}
                  alt={cliente.nombre}
                  className="w-[72px] h-[72px] shrink-0 rounded-full border-2 border-[var(--c-acento)] object-cover bg-[var(--c-campo)]"
                />
              ) : (
                <div className="w-[72px] h-[72px] shrink-0 rounded-full border-2 border-[var(--c-acento)] bg-[var(--c-campo)] flex items-center justify-center text-3xl font-bold text-[var(--c-acento)]">
                  {inicial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-bold text-[var(--c-texto)] truncate">{cliente.nombre}</p>
                <p className="text-sm text-[var(--c-texto-sec)] mt-1">{tr.qr.membresia}: {cliente.numMembresia}</p>
                <p className="text-sm text-[var(--c-texto-sec)] mt-1 flex items-center justify-center gap-2">
                  {tr.qr.estado}: <Badge estado={cliente.estado} />
                </p>
                {cliente.fechaRegistro && (
                  <p className="text-sm text-[var(--c-texto-sec)] mt-1">{tr.qr.registro}: {cliente.fechaRegistro}</p>
                )}
              </div>
            </div>
          )}

          <div className="my-4 h-px bg-[var(--c-borde-suave)]" />

          {aviso && (
            <p
              className={`mb-3 rounded-lg border px-4 py-2.5 text-center text-sm font-bold ${
                aviso.tipo === "ok"
                  ? "border-[var(--c-verde)] bg-[var(--c-verde-bg)] text-[var(--c-verde-texto)]"
                  : "border-[var(--c-rojo)] bg-[var(--c-rojo-bg)] text-[var(--c-rojo-texto)]"
              }`}
            >
              {aviso.texto}
            </p>
          )}

          <div className="flex gap-3">
            <Boton variante="exito" className="flex-1" disabled={!cliente} onClick={() => registrar("entrada")}>
              {tr.qr.entrada}
            </Boton>
            <Boton variante="peligro" className="flex-1" disabled={!cliente} onClick={() => registrar("salida")}>
              {tr.qr.salida}
            </Boton>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para registrar salida manual de un cliente dentro */}
      <Modal
        abierto={Boolean(clienteASacar)}
        titulo={tr.qr.confirmarSalidaManualTitulo}
        onClose={() => !procesandoSalida && setClienteASacar(null)}
      >
        <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
          {tr.qr.confirmarSalidaManualMsg(clienteASacar?.nombre || "")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Boton
            variante="outline"
            className="flex-1"
            disabled={procesandoSalida}
            onClick={() => setClienteASacar(null)}
          >
            {tr.cancelar}
          </Boton>
          <Boton
            variante="peligro"
            className="flex-1"
            disabled={procesandoSalida}
            onClick={confirmarSalidaManual}
          >
            {tr.qr.confirmarSalidaManualBtn}
          </Boton>
        </div>
      </Modal>
    </div>
  );
}
