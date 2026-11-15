// Fecha de nacimiento y datos de salud (igual que DatosSaludCampos de la app).
// Lo usan Clientes (Recepción y Encargado) y Personal (Encargado).
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Input from "../ui/Input.jsx";
import { hoyLocal, campoClase } from "../../utils/formato.js";

export const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const saludVacia = { fechaNacimiento: "", tipoSangre: "", alergias: "", padecimientos: "", medicamentos: "" };

// Fecha en el pasado y de hace menos de 100 años (la base valida lo mismo)
export function fechaNacimientoValida(f) {
  if (!f) return false;
  const hoy = hoyLocal();
  const [a, m, d] = hoy.split("-");
  return f < hoy && f >= `${Number(a) - 100}-${m}-${d}`;
}

// Para preparar los datos antes de mandarlos al backend
export const saludParaEnviar = (s) => ({
  ...s,
  tipoSangre: s.tipoSangre || null,
  fechaNacimiento: s.fechaNacimiento || null,
});

export default function CamposSalud({ salud, onChange, fechaObligatoria, errorFecha }) {
  const { tr } = useIdioma();
  const t = tr.salud;
  const cambiar = (campo) => (e) => onChange({ ...salud, [campo]: e.target.value });

  return (
    <>
      <p className="text-sm font-semibold text-[var(--c-texto)] mt-4 mb-2">{t.titulo}</p>
      <Input
        label={fechaObligatoria ? t.fechaNacimientoObligatoria : t.fechaNacimiento}
        type="date"
        max={hoyLocal()}
        value={salud.fechaNacimiento}
        onChange={cambiar("fechaNacimiento")}
      />
      {errorFecha && <p className="text-xs text-[var(--c-rojo)] -mt-2 mb-3">{errorFecha}</p>}
      <div className="mb-3">
        <label className="block text-sm text-[var(--c-texto-sec)] mb-1">{t.tipoSangre}</label>
        <select value={salud.tipoSangre} onChange={cambiar("tipoSangre")} className={campoClase}>
          <option value="">{t.noEspecificado}</option>
          {TIPOS_SANGRE.map((ts) => (
            <option key={ts} value={ts}>
              {ts}
            </option>
          ))}
        </select>
      </div>
      <Input label={t.alergias} maxLength={300} value={salud.alergias} onChange={cambiar("alergias")} />
      <Input label={t.padecimientos} maxLength={300} value={salud.padecimientos} onChange={cambiar("padecimientos")} />
      <Input label={t.medicamentos} maxLength={300} value={salud.medicamentos} onChange={cambiar("medicamentos")} />
    </>
  );
}
