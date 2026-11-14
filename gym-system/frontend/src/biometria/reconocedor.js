// Reconocimiento facial en el navegador, compatible con la app Android.
//
//  1. MediaPipe FaceDetector encuentra los rostros en el video.
//  2. MobileFaceNet (el MISMO archivo .tflite de la app) convierte el rostro en 192 numeros.
//  3. Ese vector se manda al backend, que lo compara en Supabase (acceso_por_rostro).
//
// Las librerias se cargan desde CDN solo cuando se abre la camara, asi no pesan en el resto
// de la pagina y no hay que instalar nada con npm. No se guardan fotos para identificar.

const TF_CORE = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js";
const TF_CPU = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.22.0/dist/tf-backend-cpu.min.js";
const TF_TFLITE = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js";
const TFLITE_WASM = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/";
const MP_VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
const MP_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODELO_DETECTOR =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const MODELO_ROSTRO = "/models/mobilefacenet.tflite"; // copiado de app/src/main/assets

export const DIMENSION = 192;
const TAM = 112; // entrada de MobileFaceNet

// La caja de MediaPipe es un poco mas cerrada que la de ML Kit (la app).
// Se agranda para que el recorte se parezca al de la app y los vectores coincidan mejor.
const AMPLIAR_LADOS = 0.08;
const AMPLIAR_ARRIBA = 0.15;

let cargando = null;

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.crossOrigin = "anonymous";
    s.dataset.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

/** Carga (una sola vez) el detector de rostros y MobileFaceNet. */
export function cargarReconocedor() {
  if (!cargando) {
    cargando = (async () => {
      await cargarScript(TF_CORE);
      await cargarScript(TF_CPU);
      await cargarScript(TF_TFLITE);
      const { tf, tflite } = window;
      tflite.setWasmPath(TFLITE_WASM);

      const vision = await import(/* @vite-ignore */ MP_VISION);
      const archivos = await vision.FilesetResolver.forVisionTasks(MP_WASM);
      const [detector, modelo] = await Promise.all([
        vision.FaceDetector.createFromOptions(archivos, {
          baseOptions: { modelAssetPath: MODELO_DETECTOR, delegate: "CPU" },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        }),
        tflite.loadTFLiteModel(MODELO_ROSTRO, { numThreads: 1 }),
      ]);
      const lote = modelo.inputs?.[0]?.shape?.[0] || 1; // algunos MobileFaceNet piden 2 imagenes
      return { tf, detector, modelo, lote };
    })().catch((e) => {
      cargando = null; // permite reintentar
      throw e;
    });
  }
  return cargando;
}

/** Rostros del cuadro actual: [{ x, y, ancho, alto, puntos }] en pixeles del video. */
export function detectar(motor, video) {
  const r = motor.detector.detectForVideo(video, performance.now());
  const w = video.videoWidth;
  const h = video.videoHeight;
  return (r.detections || []).map((d) => ({
    x: d.boundingBox.originX,
    y: d.boundingBox.originY,
    ancho: d.boundingBox.width,
    alto: d.boundingBox.height,
    // 0 ojo derecho, 1 ojo izquierdo, 2 nariz, 3 boca, 4 oreja der., 5 oreja izq.
    puntos: (d.keypoints || []).map((k) => ({ x: k.x * w, y: k.y * h })),
  }));
}

/** Giro aproximado de la cabeza (grados) a partir de ojos y nariz. */
export function giroCabeza(rostro) {
  const [ojoD, ojoI, nariz] = rostro.puntos;
  if (!ojoD || !ojoI || !nariz) return { lateral: 0, inclinacion: 0 };
  const dx = ojoI.x - ojoD.x;
  const dy = ojoI.y - ojoD.y;
  const distancia = Math.hypot(dx, dy) || 1;
  const centro = (ojoD.x + ojoI.x) / 2;
  return {
    // 0 = de frente; ~0.5 = cabeza muy girada. Se pasa a "grados" aproximados.
    lateral: (Math.abs(nariz.x - centro) / distancia) * 60,
    inclinacion: Math.abs((Math.atan2(dy, dx) * 180) / Math.PI),
  };
}

function cajaAmpliada(rostro, video) {
  const x = rostro.x - rostro.ancho * AMPLIAR_LADOS;
  const y = rostro.y - rostro.alto * AMPLIAR_ARRIBA;
  const ancho = rostro.ancho * (1 + AMPLIAR_LADOS * 2);
  const alto = rostro.alto * (1 + AMPLIAR_ARRIBA);
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  return {
    x: x0,
    y: y0,
    ancho: Math.min(video.videoWidth, x + ancho) - x0,
    alto: Math.min(video.videoHeight, y + alto) - y0,
  };
}

const lienzo = typeof document !== "undefined" ? document.createElement("canvas") : null;

/** Vector normalizado (192 numeros) del rostro, igual que ReconocedorFacial.vector() de la app. */
export async function vectorDeRostro(motor, video, rostro) {
  const c = cajaAmpliada(rostro, video);
  if (c.ancho < 8 || c.alto < 8) throw new Error("Rostro fuera de la imagen");

  lienzo.width = TAM;
  lienzo.height = TAM;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(video, c.x, c.y, c.ancho, c.alto, 0, 0, TAM, TAM);
  const { data } = ctx.getImageData(0, 0, TAM, TAM);

  // Misma normalizacion que la app: (valor - 127.5) / 128, canales R G B
  const una = new Float32Array(TAM * TAM * 3);
  for (let i = 0, j = 0; i < data.length; i += 4) {
    una[j++] = (data[i] - 127.5) / 128;
    una[j++] = (data[i + 1] - 127.5) / 128;
    una[j++] = (data[i + 2] - 127.5) / 128;
  }
  const pixeles = new Float32Array(una.length * motor.lote);
  for (let b = 0; b < motor.lote; b++) pixeles.set(una, b * una.length);

  const { tf } = motor;
  const entrada = tf.tensor4d(pixeles, [motor.lote, TAM, TAM, 3], "float32");
  let salida;
  try {
    salida = motor.modelo.predict(entrada);
    const tensor = salida instanceof tf.Tensor ? salida : Object.values(salida)[0];
    const valores = Array.from(await tensor.data()).slice(0, DIMENSION);
    return normalizar(valores);
  } finally {
    entrada.dispose();
    if (salida instanceof tf.Tensor) salida.dispose();
    else if (salida) Object.values(salida).forEach((t) => t.dispose?.());
  }
}

export function normalizar(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return n > 0 ? v.map((x) => x / n) : v;
}

/** Promedio de varias muestras (mas estable que una sola). */
export function promedio(muestras) {
  const r = new Array(DIMENSION).fill(0);
  for (const m of muestras) for (let i = 0; i < DIMENSION; i++) r[i] += m[i];
  return normalizar(r);
}

export function similitud(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Foto de perfil: cuadrado de 320 px alrededor de la cara, JPEG en base64 (como la app). */
export function fotoDeRostro(video, rostro) {
  const lado = Math.min(Math.max(rostro.ancho, rostro.alto) * 1.45, video.videoWidth, video.videoHeight);
  const cx = rostro.x + rostro.ancho / 2;
  const cy = rostro.y + rostro.alto / 2;
  const x = Math.min(Math.max(0, cx - lado / 2), video.videoWidth - lado);
  const y = Math.min(Math.max(0, cy - lado / 2), video.videoHeight - lado);

  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 320;
  c.getContext("2d").drawImage(video, x, y, lado, lado, 0, 0, 320, 320);
  return c.toDataURL("image/jpeg", 0.8).split(",")[1];
}
