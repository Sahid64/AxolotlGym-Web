import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIdioma } from "../context/IdiomaContext.jsx";
import BotonTema from "../components/ui/BotonTema.jsx";
import BotonIdioma from "../components/ui/BotonIdioma.jsx";
import FondoGym from "../components/ui/FondoGym.jsx";

const PRIVACIDAD = {
  es: {
    titulo: "POLÍTICA DE PRIVACIDAD",
    actualizacion: "Última actualización: noviembre de 2026",
    secciones: [
      {
        titulo: "1. Responsable",
        contenido:
          "Axolotl Fitness Club es el responsable del tratamiento de tus datos personales. Puedes contactarlo por teléfono o por correo, como se indica en el punto 13.",
      },
      {
        titulo: "2. Información que recopilamos",
        contenido:
          "a) De todos los usuarios: nombre, correo, teléfono, contraseña (se guarda cifrada y no puede leerse), rol, estado de la cuenta, fecha de registro, intentos fallidos de acceso y bloqueo temporal.\nb) Foto de perfil. La del cliente se toma en recepción al registrar su rostro; la del personal la toma el encargado.\nc) Del cliente: número y datos de su membresía (tipo, fechas y estado); registro de accesos (entrada, salida, fecha, hora, método facial o manual); pagos (monto, tipo, estado, quién lo confirmó y fecha) y los comprobantes que envía; solicitudes y asesorías (instructor, días y objetivo); y un contacto de emergencia (nombre y teléfono).\nd) Datos de salud del cliente, que registra recepción o el encargado: fecha de nacimiento, tipo de sangre, alergias, padecimientos o lesiones y medicamentos que toma. Algunos pueden quedar sin especificar. Son datos sensibles y se usan solo para emergencias.\ne) Datos biométricos: una representación numérica del rostro, no una fotografía.\nf) Del instructor: especialidad, horario, costo de la asesoría y máximo de clientes.\ng) De recepción: los datos de su cuenta y las acciones que registra el sistema, como registrar entradas y salidas manuales, renovar una membresía y dar de alta o editar datos de un cliente, incluidos sus datos de salud.\nh) De los visitantes de un día: nombre, teléfono, contacto de emergencia y el pago.\ni) No se guarda copia ni dato de la INE, ni datos bancarios ni números de tarjeta.",
      },
      {
        titulo: "3. Finalidad",
        contenido:
          "Usamos tus datos solo para los fines del gimnasio: identificarte y controlar tu acceso con reconocimiento facial; administrar membresías y pagos; gestionar asesorías; calcular entradas, salidas y aforo y generar reportes de ingresos y gastos; enviarte correos (contraseña inicial, aviso de vencimiento y aviso de eliminación por inactividad); verificar tu identidad cuando el sistema no te reconoce; y contactar a tu persona de emergencia o atender una emergencia con tus datos de salud. No hay finalidades secundarias como publicidad ni promociones.",
      },
      {
        titulo: "4. Datos biométricos y de salud",
        contenido:
          "El rostro se convierte en una representación numérica que se compara para identificarte al entrar. Se usa solo para el acceso. Los datos de salud se usan solo para emergencias. Al registrarte, la persona que te atiende te informa de esto en ese momento y, si no estás de acuerdo, puedes cancelar el proceso antes de que se cree tu perfil y se guarden tus datos. Puedes revocar tu consentimiento en cualquier momento pidiéndolo en recepción; sin el reconocimiento facial no hay acceso y la alternativa es la visita de un día.",
      },
      {
        titulo: "5. Quién puede ver los datos",
        contenido:
          "Cada persona ve solo lo que necesita para su función. En su perfil, el cliente ve su nombre, teléfono, correo y contacto de emergencia; sus datos de salud los registra y consulta recepción o el encargado, y puedes pedir acceso a ellos cuando quieras. El instructor ve únicamente a los clientes que tiene asignados, con su nombre, sus días y su objetivo, y no ve datos sensibles. Recepción y el encargado ven los datos del cliente necesarios para atenderlo, incluidos su contacto de emergencia y sus datos de salud.",
      },
      {
        titulo: "6. Visitantes de un día",
        contenido:
          "No se crea cuenta ni se registra el rostro. Solo se registran el nombre, el teléfono, el contacto de emergencia y el pago. La identificación oficial se revisa para comprobar la edad y no se guarda. El aviso de privacidad está disponible en el establecimiento.",
      },
      {
        titulo: "7. No compartimos tus datos",
        contenido:
          "No se venden, no se comparten ni se envían a terceros. La base de datos se aloja en Supabase, un proveedor de servicio en la nube, solo para almacenamiento.",
      },
      {
        titulo: "8. Protección",
        contenido:
          "Las contraseñas se guardan cifradas. La cuenta se bloquea 15 minutos tras 5 intentos fallidos. El personal y los instructores están obligados a mantener la confidencialidad de los datos.",
      },
      {
        titulo: "9. Conservación y eliminación",
        contenido:
          "Si un cliente pasa 365 días sin ingresar ni usar la aplicación, su cuenta se elimina de forma automática con sus datos personales, incluidos el rostro y el registro de accesos, y se le avisa por correo 30 días antes. Los registros de pagos se conservan solo con fines contables y fiscales. Los datos del personal se eliminan cuando el encargado lo da de baja.",
      },
      {
        titulo: "10. Derechos ARCO",
        contenido:
          "Tienes derecho a acceder a tus datos, a rectificarlos si son incorrectos, a pedir que se eliminen y a oponerte a su tratamiento, y puedes revocar tu consentimiento. Para ejercerlos, pídelo en recepción, por teléfono o por correo indicando tu nombre, el derecho que quieres ejercer y cómo quieres recibir la respuesta. Te responderemos a la brevedad.",
      },
      {
        titulo: "11. Mayoría de edad",
        contenido:
          "La aplicación es solo para personas de 18 años o más. Se verifica con una identificación oficial y no se guarda nada de ella.",
      },
      {
        titulo: "12. Cambios a esta política",
        contenido:
          "Te avisaremos de los cambios por correo con al menos 15 días de anticipación y en la aplicación.",
      },
      {
        titulo: "13. Contacto",
        contenido: "Teléfono: +52 314 139 7633. Correo: xcobian@ucol.mx.",
      },
      {
        titulo: "14. Aceptación",
        contenido:
          "Esta política y los Términos y Condiciones aparecen como enlaces en la pantalla de inicio de sesión y debes marcar la casilla de aceptación para entrar.",
      },
    ],
  },
  en: {
    titulo: "PRIVACY POLICY",
    actualizacion: "Last updated: November 2026",
    secciones: [
      {
        titulo: "1. Data controller",
        contenido:
          "Axolotl Fitness Club is responsible for the processing of your personal data. You may contact us by phone or email as indicated in section 13.",
      },
      {
        titulo: "2. Information we collect",
        contenido:
          "a) From all users: name, email, phone number, password (stored encrypted and unreadable), role, account status, registration date, failed login attempts, and temporary lockout.\nb) Profile photo. The client's photo is taken at reception when registering their face; staff photos are taken by the manager.\nc) From clients: membership number and details (type, dates, and status); access logs (check-in, check-out, date, time, facial or manual method); payments (amount, type, status, confirmed by, and date) and submitted receipts; coaching requests and sessions (instructor, days, and goal); and an emergency contact (name and phone).\nd) Client health data, recorded by reception or the manager: date of birth, blood type, allergies, medical conditions or injuries, and medications. Some items may remain unspecified. These are sensitive data used strictly for emergencies.\ne) Biometric data: a numerical representation of the face, not a photograph.\nf) From instructors: specialty, schedule, coaching fee, and maximum client capacity.\ng) From reception: account data and system-logged actions, such as manual check-ins/check-outs, membership renewals, and registering or editing client information, including health data.\nh) From single-day visitors: name, phone number, emergency contact, and payment.\ni) No copy or data from official IDs (INE), bank details, or card numbers is stored.",
      },
      {
        titulo: "3. Purpose",
        contenido:
          "We use your data exclusively for gym operations: identifying you and controlling access via facial recognition; managing memberships and payments; managing coaching sessions; calculating check-ins, check-outs, and occupancy and generating income and expense reports; sending operational emails (initial password, expiration notice, and inactivity deletion notice); verifying your identity when the system does not recognize you; and contacting your emergency contact or responding to an emergency using your health data. There are no secondary purposes such as advertising or promotions.",
      },
      {
        titulo: "4. Biometric and health data",
        contenido:
          "Your face is converted into a numerical representation compared for identification upon entry. It is used solely for access. Health data is used solely for emergencies. When registering, the staff member informs you of this at that moment and, if you disagree, you may cancel the process before your profile is created and your data is saved. You may revoke your consent at any time at reception; without facial recognition there is no membership access and the alternative is a single-day visit.",
      },
      {
        titulo: "5. Who can view the data",
        contenido:
          "Each role only views what is necessary for its duties. In their profile, clients view their name, phone, email, and emergency contact; their health data is recorded and viewed by reception or the manager, and you may request access to it at any time. Instructors only view their assigned clients, with their name, attendance days, and goal, and do not view sensitive data. Reception and the manager view the client data needed to assist them, including emergency contact and health data.",
      },
      {
        titulo: "6. Single-day visitors",
        contenido:
          "No account is created and no face is registered. Only name, phone number, emergency contact, and payment are recorded. Official ID is checked to verify age and is not stored. The privacy notice is available at the facility.",
      },
      {
        titulo: "7. We do not share your data",
        contenido:
          "Your data is not sold, shared, or sent to third parties. The database is hosted on Supabase, a cloud service provider, strictly for storage.",
      },
      {
        titulo: "8. Protection",
        contenido:
          "Passwords are stored encrypted. Accounts are locked for 15 minutes after 5 failed attempts. Staff and instructors are required to maintain data confidentiality.",
      },
      {
        titulo: "9. Retention and deletion",
        contenido:
          "If a client goes 365 days without entering or using the application, their account is automatically deleted along with their personal data, including facial data and access logs, with a 30-day advance email notice. Payment records are retained strictly for accounting and tax purposes. Staff data is deleted when terminated by the manager.",
      },
      {
        titulo: "10. ARCO rights",
        contenido:
          "You have the right to access your data, rectify it if inaccurate, request its deletion, object to its processing, and revoke your consent. To exercise these rights, request it at reception, by phone, or by email stating your name, the right you wish to exercise, and how you wish to receive the response. We will reply promptly.",
      },
      {
        titulo: "11. Legal age",
        contenido:
          "The application is strictly for individuals 18 years of age or older. Age is verified with an official ID and nothing from it is stored.",
      },
      {
        titulo: "12. Changes to this policy",
        contenido:
          "We will notify you of any changes by email at least 15 days in advance and within the application.",
      },
      {
        titulo: "13. Contact",
        contenido: "Phone: +52 314 139 7633. Email: xcobian@ucol.mx.",
      },
      {
        titulo: "14. Acceptance",
        contenido:
          "This policy and the Terms and Conditions appear as links on the sign-in screen and you must check the acceptance box to enter.",
      },
    ],
  },
};

export default function Privacidad() {
  const { idioma, tr } = useIdioma();
  const navigate = useNavigate();
  const location = useLocation();
  // Vuelve a la pantalla de la que venía (inicio o login). Si se abrió directo, va al inicio.
  const volver = (e) => {
    e.preventDefault();
    if (location.key !== "default") navigate(-1);
    else navigate("/");
  };
  const doc = PRIVACIDAD[idioma] || PRIVACIDAD.es;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-[var(--c-fondo)]">
      <FondoGym />
      <BotonIdioma className="absolute top-4 left-4 z-10" />
      <BotonTema className="absolute top-4 right-4 z-10" />

      <div className="fx-borde relative z-10 w-full max-w-3xl">
        <div className="fx-cristal rounded-[calc(1rem-1.5px)] p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-4">
            <img
              src="/logo_final.png"
              alt="Axolotl"
              className="w-16 h-16 object-contain"
              style={{ filter: "drop-shadow(0 0 18px var(--c-acento-60))" }}
            />
            <h1 className="mt-2 text-xl font-bold tracking-wider text-[var(--c-texto)]">
              {doc.titulo}
            </h1>
            <p className="text-xs text-[var(--c-acento-texto)] mt-1 font-medium">
              {doc.actualizacion}
            </p>
          </div>

          <div className="my-4 h-px bg-[var(--c-borde-suave)]" />

          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-sm leading-relaxed text-[var(--c-texto-sec)]">
            {doc.secciones.map((s) => (
              <section
                key={s.titulo}
                className="rounded-lg border border-[var(--c-borde-30)] bg-[var(--c-campo)]/60 p-4"
              >
                <h2 className="text-sm font-bold text-[var(--c-acento-texto)] mb-1.5">
                  {s.titulo}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--c-texto-sec)] whitespace-pre-line">
                  {s.contenido}
                </p>
              </section>
            ))}
          </div>

          <div className="my-4 h-px bg-[var(--c-borde-suave)]" />

          <div className="flex justify-center">
            <Link
              to="/"
              onClick={volver}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-md text-sm font-medium bg-[var(--c-bronce)] hover:bg-[var(--c-acento)] text-[var(--c-sobre-acento)] transition-colors"
            >
              {tr.volverAtras}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
