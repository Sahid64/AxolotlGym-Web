# Axolotl Gym — Sistema de Gestión

Aplicación web para administrar un gimnasio: clientes y membresías, pagos, control de acceso con **reconocimiento facial** y **códigos QR**, personal, servicios, asesorías, gastos y reportes, con paneles separados por rol.

> Frontend desplegable en Vercel · Backend en Node.js/Express · Base de datos en Supabase

---

## Tabla de contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Despliegue](#-despliegue)
- [Capturas de pantalla](#-capturas-de-pantalla)
- [Privacidad y datos biométricos](#-privacidad-y-datos-biométricos)
- [Autores](#-autores)
- [Licencia](#-licencia)

---

## Características

- **Autenticación y roles** (encargado / recepción) con rutas protegidas y recuperación de contraseña.
- **Gestión de clientes**: alta, datos de salud, políticas, cancelación de membresía.
- **Pagos**: registro y pagos pendientes.
- **Control de acceso**:
  - Reconocimiento facial en el navegador (MediaPipe + MobileFaceNet con TensorFlow Lite).
  - Acceso mediante código QR.
  - Registro de visitas.
- **Panel del encargado**: dashboard, movimientos, gastos, personal, servicios, avisos y reportes.
- **Recepción**: clientes, solicitudes y acceso facial.
- **Asesorías** y **avisos** para los clientes.
- **Interfaz**: tema claro/oscuro, cambio de idioma, diseño responsive con Tailwind.
- Páginas de **Términos y condiciones** y **Aviso de privacidad**.

## Tecnologías

| Capa | Stack |
|------|-------|
| Frontend | React, Vite, Tailwind CSS |
| Biometría | MediaPipe (visión), TensorFlow Lite, MobileFaceNet |
| Backend | Node.js, Express |
| Base de datos | Supabase (PostgreSQL) |
| Despliegue | Vercel (frontend) |

## Estructura del proyecto

```
AxolotlGym-Web/
└── gym-system/
    ├── backend/
    │   ├── server.js
    │   └── src/
    │       ├── controllers/   # Lógica de cada módulo
    │       ├── routes/        # Endpoints de la API
    │       ├── middleware/    # Autenticación / autorización
    │       └── data/          # Cliente de Supabase y caché
    ├── frontend/
    │   ├── public/            # Imágenes, modelos y WASM (mediapipe, tflite)
    │   ├── scripts/           # Optimización de imágenes
    │   └── src/
    │       ├── api/           # Cliente HTTP
    │       ├── biometria/     # Reconocedor facial
    │       ├── components/    # UI, layout, facial, clientes, pagos
    │       ├── context/       # Auth, tema, idioma
    │       ├── pages/         # compartidas, encargado, recepcion
    │       └── routes/        # Rutas de la app
    └── sql/
        └── optimizacion_rendimiento.sql
```
## Privacidad y datos biométricos

El sistema procesa datos personales y biométricos (rostro) de los clientes. Se debe contar con su consentimiento y cumplir con la normativa aplicable de protección de datos. Consulta las páginas de Términos y Privacidad incluidas en la aplicación.
