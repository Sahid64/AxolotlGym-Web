import { useEffect, useState } from "react";
import api from "../../api/api.js";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Boton from "../../components/ui/Boton.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function Solicitudes() {
  const { tr, traducirMsg } = useIdioma();
  const [solicitudes, setSolicitudes] = useState([]);
  const [aviso, setAviso] = useState("");
  const [confirmando, setConfirmando] = useState(null); // { solicitud, accion: "aprobar" | "rechazar" }

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const { data } = await api.get("/solicitudes");
    setSolicitudes(data.solicitudes);
  }

  async function ejecutarAccion() {
    if (!confirmando) return;
    const { solicitud, accion } = confirmando;
    try {
      const { data } = await api.put(`/solicitudes/${solicitud.id}/${accion}`);
      setAviso(traducirMsg(data.mensaje) || "");
    } catch (err) {
      setAviso(traducirMsg(err.response?.data?.mensaje) || "");
    }
    setConfirmando(null);
    cargar();
  }

  const columnas = [
    { key: "clienteNombre", label: tr.solicitudes.colCliente },
    { key: "instructorNombre", label: tr.solicitudes.colInstructor },
    { key: "costo", label: tr.solicitudes.colCosto, render: (f) => `$${f.costo}` },
    { key: "fechaSolicitud", label: tr.solicitudes.colFecha },
    { key: "estado", label: tr.solicitudes.colEstado, render: (f) => <Badge estado={f.estado} /> },
    {
      key: "acciones",
      label: tr.acciones,
      render: (f) =>
        f.estado === "pendiente" ? (
          <div className="flex items-center justify-center gap-2">
            <Boton variante="exito" onClick={() => setConfirmando({ solicitud: f, accion: "aprobar" })}>
              {tr.solicitudes.aprobar}
            </Boton>
            <Boton variante="peligro" onClick={() => setConfirmando({ solicitud: f, accion: "rechazar" })}>
              {tr.solicitudes.rechazar}
            </Boton>
          </div>
        ) : (
          <span className="text-[var(--c-texto-tenue)] text-xs">{tr.solicitudes.sinAcciones}</span>
        ),
    },
  ];

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-xl font-semibold text-[var(--c-texto)]">{tr.solicitudes.titulo}</h1>
        {pendientes > 0 && (
          <span className="bg-[var(--c-rojo)] text-white text-xs rounded-full px-2 py-0.5">{pendientes}</span>
        )}
      </div>

      {aviso && <p className="text-sm text-center text-[var(--c-ambar-texto)] mb-3">{aviso}</p>}

      <Table columnas={columnas} filas={solicitudes} />

      <Modal
        abierto={Boolean(confirmando)}
        titulo={
          confirmando?.accion === "aprobar"
            ? tr.solicitudes.confirmarAprobarTitulo
            : tr.solicitudes.confirmarRechazarTitulo
        }
        onClose={() => setConfirmando(null)}
      >
        {confirmando && (
          <>
            <p className="text-sm text-center text-[var(--c-texto-sec)] mb-6">
              {confirmando.accion === "aprobar"
                ? tr.solicitudes.confirmarAprobarMsg(
                    confirmando.solicitud.clienteNombre,
                    confirmando.solicitud.instructorNombre
                  )
                : tr.solicitudes.confirmarRechazarMsg(
                    confirmando.solicitud.clienteNombre,
                    confirmando.solicitud.instructorNombre
                  )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Boton variante="outline" className="flex-1" onClick={() => setConfirmando(null)}>
                {tr.cancelar}
              </Boton>
              <Boton
                variante={confirmando.accion === "aprobar" ? "exito" : "peligro"}
                className="flex-1"
                onClick={ejecutarAccion}
              >
                {confirmando.accion === "aprobar" ? tr.solicitudes.aprobar : tr.solicitudes.rechazar}
              </Boton>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
