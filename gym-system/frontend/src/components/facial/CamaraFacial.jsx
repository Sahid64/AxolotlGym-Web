import { useEffect, useRef, useState } from "react";
import { useIdioma } from "../../context/IdiomaContext.jsx";
import Boton from "../ui/Boton.jsx";
import {
  cargarReconocedor, detectar, giroCabeza, vectorDeRostro, promedio, similitud, fotoDeRostro, ojosAbiertos,
} from "../../biometria/reconocedor.js";

// Mismas reglas que CapturaFacial.kt de la app
const TAMANO_MINIMO = 0.22; // el rostro debe ocupar al menos este ancho del cuadro
const GIRO_MAXIMO = 18; // grados
const CONSISTENCIA = 0.8; // todas las muestras deben parecerse al promedio
const CUADROS_PARA_OLVIDAR = 6; // cuadros sin rostro para aceptar a la siguiente persona
const INTERVALO_MS = 120;
const ESPERA_REINTENTO_MS = 2000;
// Prueba de vida (igual que la app): el rostro debe parpadear (abiertos → cerrados → abiertos).
// Una foto impresa o en una pantalla no parpadea, así que no sirve para entrar ni para registrar.
const OJO_ABIERTO = 0.6;
const OJO_CERRADO = 0.35;
const ESPERANDO_PARPADEO = 0.9; // avance que se muestra mientras solo falta el parpadeo

const parpadeoNuevo = () => ({ vioAbiertos: false, vioCerrados: false, listo: false });

/**
 * Camara con reconocimiento facial.
 * - Toma varias muestras del rostro mas cercano y llama a onRostro(vector, fotoBase64).
 * - modo "continuo": despues de cada persona espera a que se retire (toma de lista).
 * - modo "unico": se apaga despues del primer rostro aceptado (registro de rostro).
 * Si onRostro lanza un error, se vuelve a intentar con la misma persona.
 */
export default function CamaraFacial({ muestrasNecesarias = 3, modo = "continuo", onRostro, encenderAlAbrir = false }) {
  const { tr } = useIdioma();
  const t = tr.facial;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const activoRef = useRef(false);
  const onRostroRef = useRef(onRostro);
  const est = useRef({ muestras: [], procesado: false, sinRostro: 0, parpadeo: parpadeoNuevo() });

  const [estado, setEstado] = useState("apagada"); // apagada | cargando | activa | error | errorModelos
  const [indicacion, setIndicacion] = useState("posicion");
  const [progreso, setProgreso] = useState(0);

  onRostroRef.current = onRostro;

  useEffect(() => {
    if (encenderAlAbrir) encender();
    return () => apagar(false);
  }, []);

  async function encender() {
    setEstado("cargando");
    setIndicacion("posicion");
    setProgreso(0);
    est.current = { muestras: [], procesado: false, sinRostro: 0, esperaHasta: 0, parpadeo: parpadeoNuevo() };
    try {
      const [motor, stream] = await Promise.all([
        cargarReconocedor().catch((e) => {
          e.modelos = true;
          throw e;
        }),
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        }),
      ]);
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return stream.getTracks().forEach((tr) => tr.stop()); // ya se cerro la pantalla
      video.srcObject = stream;
      await video.play();
      activoRef.current = true;
      setEstado("activa");
      ciclo(motor);
    } catch (e) {
      console.error(e);
      apagar(false);
      setEstado(e?.modelos ? "errorModelos" : "error");
    }
  }

  function apagar(actualizar = true) {
    activoRef.current = false;
    clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (actualizar) setEstado("apagada");
  }

  function indicar(clave, avance = 0) {
    setIndicacion(clave);
    setProgreso(avance);
  }

  function ciclo(motor) {
    const paso = async () => {
      if (!activoRef.current) return;
      try {
        await procesarCuadro(motor);
      } catch (e) {
        console.error(e);
        est.current.muestras = [];
        indicar("centra");
      }
      if (activoRef.current) timerRef.current = setTimeout(paso, INTERVALO_MS);
    };
    paso();
  }

  async function procesarCuadro(motor) {
    const video = videoRef.current;
    const s = est.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    if (s.esperaHasta && Date.now() < s.esperaHasta) return;

    const rostros = detectar(motor, video);
    const area = (r) => r.ancho * r.alto;
    const cara = rostros.reduce((a, b) => (!a || area(b) > area(a) ? b : a), null);

    if (!cara) {
      s.muestras = [];
      s.parpadeo = parpadeoNuevo(); // se fue la persona: la siguiente debe parpadear de nuevo
      if (s.procesado && ++s.sinRostro >= CUADROS_PARA_OLVIDAR) s.procesado = false; // ya se retiro
      if (!s.procesado) indicar("posicion");
      return;
    }
    s.sinRostro = 0;

    if (s.procesado) return indicar("listoRetirate", 1);

    // Dos personas casi a la misma distancia: no se adivina quien es
    const segunda = Math.max(0, ...rostros.filter((r) => r !== cara).map(area));
    if (segunda > area(cara) * 0.8) {
      s.muestras = [];
      return indicar("unaPersona");
    }
    if (cara.ancho < video.videoWidth * TAMANO_MINIMO) {
      s.muestras = [];
      return indicar("acercate");
    }
    if (cara.x < 0 || cara.y < 0 || cara.x + cara.ancho > video.videoWidth || cara.y + cara.alto > video.videoHeight) {
      s.muestras = [];
      return indicar("centra");
    }
    const giro = giroCabeza(cara);
    if (giro.lateral > GIRO_MAXIMO || giro.inclinacion > GIRO_MAXIMO) {
      s.muestras = [];
      return indicar("mira");
    }

    // Prueba de vida: abiertos → cerrados → abiertos
    const ojos = ojosAbiertos(motor, video, cara);
    if (!ojos) return indicar("mira");
    const p = s.parpadeo;
    const abiertos = ojos.izq >= OJO_ABIERTO && ojos.der >= OJO_ABIERTO;
    const cerrados = ojos.izq <= OJO_CERRADO && ojos.der <= OJO_CERRADO;
    if (cerrados && p.vioAbiertos) p.vioCerrados = true;
    if (abiertos) {
      if (p.vioAbiertos && p.vioCerrados) p.listo = true;
      p.vioAbiertos = true;
    }
    // Con los ojos cerrados o entrecerrados la muestra sale mala: no se usa
    if (!abiertos) {
      return indicar(p.listo ? "mira" : "parpadea", s.muestras.length / muestrasNecesarias);
    }

    s.muestras.push(await vectorDeRostro(motor, video, cara));
    if (s.muestras.length < muestrasNecesarias) {
      return indicar("quieto", s.muestras.length / muestrasNecesarias);
    }
    // Ya hay muestras suficientes pero falta el parpadeo: se conservan las más recientes
    if (!p.listo) {
      while (s.muestras.length > muestrasNecesarias) s.muestras.shift();
      return indicar("parpadea", ESPERANDO_PARPADEO);
    }

    const vector = promedio(s.muestras);
    // Si alguna muestra salio muy distinta (movimiento, otra persona) se repite
    const consistente = s.muestras.every((m) => similitud(m, vector) >= CONSISTENCIA);
    s.muestras = [];
    if (!consistente) return indicar("quieto", 0);

    indicar("verificando", 1);
    const foto = fotoDeRostro(video, cara);
    try {
      await onRostroRef.current?.(vector, foto);
      s.procesado = true;
      s.parpadeo = parpadeoNuevo();
      if (modo === "unico") apagar();
      else indicar("listoRetirate", 1);
    } catch {
      // Error (no reconocido, red, rostro repetido...): se vuelve a intentar tras una pausa
      s.procesado = false;
      s.esperaHasta = Date.now() + ESPERA_REINTENTO_MS;
      indicar("posicion");
    }
  }

  return (
    <div>
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[var(--c-campo)] mb-3">
        {/* Se ve como espejo para que sea natural; el cuadro que se analiza no se voltea */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${estado === "activa" ? "" : "invisible"}`}
        />

        {estado !== "activa" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--c-texto-tenue)]">
            {estado === "cargando" && <p>{t.cargando}</p>}
            {estado === "apagada" && (
              <>
                <p>{t.camaraApagada}</p>
                <Boton onClick={encender}>{t.encenderCamara}</Boton>
              </>
            )}
            {(estado === "error" || estado === "errorModelos") && (
              <>
                <p>{estado === "error" ? t.errorCamara : t.errorModelos}</p>
                <Boton variante="outline" onClick={encender}>{t.reintentar}</Boton>
              </>
            )}
          </div>
        )}

        {/* Guia ovalada para colocar la cara */}
        {estado === "activa" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`w-[42%] aspect-[3/4] rounded-[50%] border-4 transition-colors ${
                indicacion === "listoRetirate" || indicacion === "verificando"
                  ? "border-[var(--c-verde)]"
                  : "border-[var(--c-acento)]"
              }`}
            />
          </div>
        )}
      </div>

      {estado === "activa" && (
        <>
          <p className="text-center text-sm font-medium text-[var(--c-texto)] mb-2">{t.indicaciones[indicacion]}</p>
          <div className="h-1.5 rounded-full bg-[var(--c-campo)] overflow-hidden mb-3">
            <div
              className="h-full bg-[var(--c-acento)] transition-all duration-150"
              style={{ width: `${Math.round(progreso * 100)}%` }}
            />
          </div>
          <Boton variante="outline" className="w-full" onClick={() => apagar()}>
            {t.apagarCamara}
          </Boton>
        </>
      )}
    </div>
  );
}
