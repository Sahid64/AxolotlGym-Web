import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIdioma } from "../context/IdiomaContext.jsx";
import BotonTema from "../components/ui/BotonTema.jsx";
import BotonIdioma from "../components/ui/BotonIdioma.jsx";
import FondoGym from "../components/ui/FondoGym.jsx";

const TERMINOS = {
  es: {
    titulo: "TÉRMINOS Y CONDICIONES",
    actualizacion: "Última actualización: noviembre de 2026",
    secciones: [
      {
        titulo: "1. Aceptación de los términos",
        contenido:
          "Al iniciar sesión en GymControl, la aplicación de Axolotl Fitness Club, y al usar sus instalaciones, aceptas estos Términos y Condiciones. La aceptación se hace en la pantalla de inicio de sesión: debes marcar la casilla para poder entrar, y se te pide cada vez que inicias sesión. Si no estás de acuerdo, no uses la aplicación.",
      },
      {
        titulo: "2. Objeto del servicio",
        contenido:
          "GymControl es una aplicación para Android de Axolotl Fitness Club. Sirve para controlar el acceso de los clientes, administrar membresías, solicitar asesorías con instructores, registrar pagos y generar reportes de ingresos y gastos.",
      },
      {
        titulo: "3. Roles de usuario",
        contenido:
          "La aplicación tiene cuatro tipos de usuario y cada uno solo accede a las funciones de su rol. El cliente solicita asesorías, consulta los métodos de pago, envía comprobantes y ve su perfil, donde puede actualizar su teléfono, su contacto de emergencia y su contraseña. El instructor consulta a los clientes que tiene asignados, edita sus días de asistencia y su objetivo, y edita sus propios datos. Recepción atiende el acceso por reconocimiento facial, registra el rostro de los clientes, puede registrar entradas y salidas de forma manual, da de alta, renueva y edita clientes, atiende las solicitudes de asesoría, cobra las visitas y confirma los pagos en efectivo y con tarjeta. El encargado administra clientes, personal, servicios y gastos, consulta el dashboard y los reportes, y valida los pagos.",
      },
      {
        titulo: "4. Capacidad para usar la aplicación",
        contenido:
          "Solo pueden usar la aplicación y las instalaciones personas de 18 años o más. Recepción o el encargado lo verifican con una identificación oficial (INE) y no se guarda copia ni dato alguno de ella. Si la persona no tiene la edad, se le niega el servicio.",
      },
      {
        titulo: "5. Cuenta, contraseña y bloqueo",
        contenido:
          "Las cuentas las da de alta el personal; no hay autorregistro. Todos los roles inician sesión con correo y contraseña. La contraseña inicial se envía al correo del usuario. La cuenta y la contraseña son personales e intransferibles, y eres responsable de lo que se haga con ellas. La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo. Puedes cambiarla desde la pantalla de inicio de sesión; si no recuerdas la actual, la aplicación envía un código a tu correo para confirmar tu identidad. Tras 5 intentos fallidos, la cuenta se bloquea durante 15 minutos, y el contador se reinicia cuando entras correctamente.",
      },
      {
        titulo: "6. Inactividad y eliminación de la cuenta",
        contenido:
          "Si un cliente pasa 365 días sin ingresar ni usar la aplicación, su cuenta se elimina de forma automática junto con sus datos personales. Se le avisa por correo 30 días antes. Esto solo aplica a clientes. Al eliminar la cuenta no se conserva ningún dato personal; solo se mantienen los registros de pagos, con fines contables y fiscales.",
      },
      {
        titulo: "7. Membresías",
        contenido:
          "Los planes y sus costos los asigna el encargado y pueden cambiar. La vigencia empieza cuando se confirma el pago. Una membresía está activa cuando su estado es activo y su fecha de vencimiento es la del día o posterior. Si está vencida, solo se te niega el acceso al gimnasio hasta que la renueves. La renovación la hacen recepción o el encargado. La membresía es personal e intransferible.",
      },
      {
        titulo: "8. Visitas de un día",
        contenido:
          "La visita da acceso solo el día en que se paga y no crea una cuenta. Se registran el nombre, el teléfono y un contacto de emergencia (nombre y teléfono) del visitante, y el pago, que se hace en efectivo o con tarjeta, se registra como ingreso. Recepción o el encargado piden una identificación oficial (INE) para comprobar la mayoría de edad y no se guarda nada de ella. No se registra el rostro del visitante. El aviso de privacidad está disponible en el establecimiento. Cada vez que entra, repite todo el proceso.",
      },
      {
        titulo: "9. Pagos",
        contenido:
          "Se aceptan pagos en efectivo, con tarjeta, por transferencia y por depósito, en pesos mexicanos. Recepción confirma los pagos en efectivo y con tarjeta; el encargado confirma las transferencias y los depósitos, y también puede confirmar los otros dos. Un pago puede estar pendiente, aceptado o rechazado. Si pagas por transferencia o depósito, la aplicación te muestra los datos para hacerlo y tú envías el comprobante; el encargado lo revisa y, si lo acepta, se activa tu membresía. Si lo rechaza, verás el motivo y podrás enviarlo de nuevo. La aplicación no procesa cobros ni guarda números de tarjeta ni datos bancarios. Los servicios adicionales se cobran aparte.",
      },
      {
        titulo: "10. Cancelaciones y reembolsos de membresías",
        contenido:
          "Tienes derecho a reembolso completo si cancelas dentro de las primeras 48 horas después de pagar y aún no has ingresado, o si hubo un error de cobro. En cualquier otro caso no hay reembolso y puedes usar la membresía hasta su vencimiento. El reembolso se hace por el mismo medio de pago en máximo 10 días hábiles. La cancelación se solicita en recepción y solo el encargado la autoriza.",
      },
      {
        titulo: "11. Asesorías",
        contenido:
          "Las asesorías se solicitan desde la aplicación y quedan pendientes hasta que recepción las aprueba o las rechaza. Puedes cancelarlas sin costo mientras estén pendientes. Cada instructor fija su costo y su máximo de clientes, y define contigo los días de asistencia y tu objetivo. La asesoría se paga del mismo modo que la membresía, como se explica en el punto 9.",
      },
      {
        titulo: "12. Cancelación y reembolso de asesorías",
        contenido:
          "Si cancelas con al menos 24 horas de anticipación, el reembolso es completo y por el mismo medio de pago. Si cancelas con menos tiempo o no te presentas, no hay reembolso. Si el instructor cancela, tú eliges entre el reembolso o reprogramar.",
      },
      {
        titulo: "13. Identidad y reconocimiento facial",
        contenido:
          "El acceso al gimnasio se verifica con reconocimiento facial. Recepción registra tu rostro y, a partir de entonces, tu entrada y tu salida se registran de forma automática cuando el sistema te reconoce. Recepción también puede registrar tu salida de forma manual sin usar el reconocimiento. Tus datos biométricos se usan solo para controlar el acceso. Al registrarte, la persona que te atiende te informa de esto y de tus datos de salud, y si no estás de acuerdo puedes cancelar el proceso antes de que se cree tu perfil y se guarden tus datos. Sin aceptar el reconocimiento facial no hay acceso; la única alternativa es la visita de un día.",
      },
      {
        titulo: "14. Cliente registrado no reconocido",
        contenido:
          "Si el sistema no te reconoce, recepción o el encargado verifican tu identidad con tu número de membresía y una identificación oficial, sin guardar nada de ella. El encargado autoriza el ingreso y este se registra manualmente. Si el problema persiste, se actualiza tu registro facial. Si no acreditas tu identidad, no entras ese día.",
      },
      {
        titulo: "15. Suplantación",
        contenido:
          "Está prohibido entrar haciéndose pasar por otra persona. Se suspende la cuenta de quien suplanta y de quien presta la suya, se cancela la membresía sin reembolso y Axolotl puede presentar una denuncia. Recepción informa al encargado y él toma la decisión final.",
      },
      {
        titulo: "16. Aforo y horarios de afluencia",
        contenido:
          "La aplicación muestra la cantidad de personas dentro del gimnasio, calculada con las entradas y salidas del día, y se reinicia cada día al cerrar el establecimiento. Puede haber un pequeño margen de error si alguien no marca su salida. Los horarios de menor afluencia se calculan con las entradas reales de las últimas 4 semanas.",
      },
      {
        titulo: "17. Obligaciones del personal e instructores",
        contenido:
          "El personal y los instructores usan los datos de los clientes solo para su función, los mantienen confidenciales, no los copian ni los comparten, y no los usan con fines personales. Cuando registran una entrada o una salida de forma manual, verifican la identidad con honestidad. El incumplimiento puede llevar a la suspensión de su cuenta.",
      },
      {
        titulo: "18. Normas de convivencia y seguridad",
        contenido:
          "Las normas internas del establecimiento están escritas y visibles en sus instalaciones. Incumplirlas puede llevar a una amonestación, a una suspensión temporal o a la baja.",
      },
      {
        titulo: "19. Prohibiciones",
        contenido:
          "No se permite compartir la cuenta o la contraseña, entrar a funciones de otro rol, manipular el sistema o vulnerar su seguridad, ni usar la aplicación con fines ilícitos.",
      },
      {
        titulo: "20. Suspensión y baja",
        contenido:
          "La cuenta puede suspenderse por suplantación, incumplimiento de estos términos o conducta violenta u ofensiva. Una membresía vencida no suspende la cuenta; solo niega el acceso al gimnasio. El encargado da de baja al personal y sus datos se eliminan.",
      },
      {
        titulo: "21. Salud y condición física",
        contenido:
          "La actividad física implica riesgos. Consulta a un médico antes de entrenar y avisa a tus instructores de cualquier condición relevante. Al darte de alta, recepción o el encargado registran tu fecha de nacimiento, tu tipo de sangre, tus alergias, padecimientos o lesiones y los medicamentos que tomas, solo para atender una emergencia; algunos de estos datos pueden quedar sin especificar. La aplicación no sustituye la opinión médica ni da seguimiento a tu progreso físico.",
      },
      {
        titulo: "22. Disponibilidad del servicio",
        contenido:
          "La aplicación depende de internet, de la cámara del dispositivo y de un servicio en la nube, por lo que no se garantiza que funcione sin interrupciones.",
      },
      {
        titulo: "23. Datos personales",
        contenido: "El tratamiento de tus datos personales se rige por la Política de Privacidad.",
      },
      {
        titulo: "24. Avisos y modificaciones",
        contenido:
          "Los avisos se envían por correo y, cuando aplique, por la aplicación y en el establecimiento. Los cambios a estos términos, a los precios o a las políticas se avisan con al menos 15 días naturales de anticipación, y los cierres o cambios de horario con al menos 3 días. Debes mantener tu correo actualizado.",
      },
      {
        titulo: "25. Ley aplicable",
        contenido: "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.",
      },
      {
        titulo: "26. Contacto",
        contenido: "Teléfono: +52 314 139 7633. Correo: xcobian@ucol.mx.",
      },
    ],
  },
  en: {
    titulo: "TERMS AND CONDITIONS",
    actualizacion: "Last updated: November 2026",
    secciones: [
      {
        titulo: "1. Acceptance of terms",
        contenido:
          "By signing in to GymControl, the Axolotl Fitness Club application, and using its facilities, you accept these Terms and Conditions. Acceptance takes place on the sign-in screen: you must check the box to enter, and it is requested every time you sign in. If you do not agree, do not use the application.",
      },
      {
        titulo: "2. Purpose of the service",
        contenido:
          "GymControl is an Android and web application of Axolotl Fitness Club. It is used to control client access, manage memberships, request coaching sessions with instructors, record payments, and generate income and expense reports.",
      },
      {
        titulo: "3. User roles",
        contenido:
          "The system has four user roles and each one only accesses the functions of its role. The client requests coaching sessions, checks payment methods, sends receipts, and views their profile, where they can update their phone number, emergency contact, and password. The instructor views assigned clients, edits their attendance days and goals, and edits their own information. Reception handles facial recognition access, registers clients' faces, manually records check-ins and check-outs, registers, renews, and edits clients, handles coaching requests, charges day visits, and confirms cash and card payments. The manager administers clients, staff, services, and expenses, views the dashboard and reports, and validates payments.",
      },
      {
        titulo: "4. Eligibility to use the application",
        contenido:
          "Only individuals 18 years of age or older may use the application and facilities. Reception or the manager verifies this with an official ID (INE) and no copy or data from it is stored. If the person is underage, service is denied.",
      },
      {
        titulo: "5. Account, password, and lockout",
        contenido:
          "Accounts are registered by staff; there is no self-registration. All roles sign in with email and password. The initial password is sent to the user's email. The account and password are personal and non-transferable, and you are responsible for any activity performed with them. The password must be at least 8 characters long, including an uppercase letter, lowercase letter, number, and symbol. You can change it from the sign-in screen; if you forget your current password, the application sends a code to your email to confirm your identity. After 5 failed attempts, the account is locked for 15 minutes, and the counter resets upon a successful sign-in.",
      },
      {
        titulo: "6. Inactivity and account deletion",
        contenido:
          "If a client goes 365 days without entering or using the application, their account is automatically deleted along with their personal data. A notice is sent by email 30 days in advance. This applies only to clients. When the account is deleted, no personal data is kept; only payment records are retained for accounting and tax purposes.",
      },
      {
        titulo: "7. Memberships",
        contenido:
          "Plans and their costs are set by the manager and may change. Validity begins when payment is confirmed. A membership is active when its status is active and its expiration date is today or later. If expired, access to the gym is denied until renewed. Renewal is performed by reception or the manager. Memberships are personal and non-transferable.",
      },
      {
        titulo: "8. Day passes (single-day visits)",
        contenido:
          "A day visit grants access only on the day it is paid and does not create an account. The visitor's name, phone number, and emergency contact (name and phone) are recorded, and the payment—made in cash or by card—is recorded as revenue. Reception or the manager requests an official ID (INE) to verify legal age and nothing from it is stored. The visitor's face is not registered. The privacy notice is available at the facility. The entire process is repeated on each visit.",
      },
      {
        titulo: "9. Payments",
        contenido:
          "Payments are accepted in cash, by card, bank transfer, and deposit, in Mexican pesos (MXN). Reception confirms cash and card payments; the manager confirms transfers and deposits, and can also confirm cash and card payments. A payment may be pending, accepted, or rejected. If paying by transfer or deposit, the application shows the account details and you upload the receipt; the manager reviews it and, if accepted, your membership is activated. If rejected, you will see the reason and can submit it again. The application does not process charges or store card numbers or bank data. Additional services are charged separately.",
      },
      {
        titulo: "10. Membership cancellations and refunds",
        contenido:
          "You are entitled to a full refund if you cancel within the first 48 hours after payment and have not yet entered the facility, or if there was a billing error. In any other case, there is no refund and you may use the membership until it expires. Refunds are issued via the same payment method within a maximum of 10 business days. Cancellation must be requested at reception and is authorized only by the manager.",
      },
      {
        titulo: "11. Coaching sessions",
        contenido:
          "Coaching sessions are requested from the application and remain pending until reception approves or rejects them. You may cancel them free of charge while pending. Each instructor sets their fee and maximum number of clients, and defines your attendance days and goals with you. Coaching is paid in the same way as memberships, as explained in section 9.",
      },
      {
        titulo: "12. Coaching cancellation and refunds",
        contenido:
          "If you cancel at least 24 hours in advance, a full refund is issued via the same payment method. If you cancel with less notice or do not show up, no refund is given. If the instructor cancels, you may choose between a refund or rescheduling.",
      },
      {
        titulo: "13. Identity and facial recognition",
        contenido:
          "Gym access is verified through facial recognition. Reception registers your face and, from then on, your check-in and check-out are recorded automatically when the system recognizes you. Reception can also record your check-out manually without facial recognition. Your biometric data is used solely for access control. Upon registration, the staff member informs you of this and of your health data, and if you disagree, you may cancel the process before your profile is created and your data is stored. Without accepting facial recognition there is no membership access; the only alternative is a single-day visit.",
      },
      {
        titulo: "14. Unrecognized registered client",
        contenido:
          "If the system does not recognize you, reception or the manager verifies your identity using your membership number and an official ID, without storing anything from it. The manager authorizes entry and it is recorded manually. If the issue persists, your facial record is updated. If you cannot verify your identity, entry is not permitted that day.",
      },
      {
        titulo: "15. Impersonation",
        contenido:
          "Entering by impersonating another person is strictly prohibited. Both the impersonator's account and the account of the person who lent theirs will be suspended, the membership will be cancelled without refund, and Axolotl may file a legal complaint. Reception informs the manager, who makes the final decision.",
      },
      {
        titulo: "16. Capacity and peak hours",
        contenido:
          "The application displays the number of people inside the gym, calculated from the day's check-ins and check-outs, and resets daily at closing time. There may be a small margin of error if someone does not record their check-out. Off-peak hours are calculated from actual check-ins over the past 4 weeks.",
      },
      {
        titulo: "17. Staff and instructor obligations",
        contenido:
          "Staff and instructors use client data solely for their duties, keep it confidential, do not copy or share it, and do not use it for personal purposes. When manually recording a check-in or check-out, they verify identity honestly. Non-compliance may result in account suspension.",
      },
      {
        titulo: "18. Code of conduct and safety rules",
        contenido:
          "Internal facility rules are posted and visible on the premises. Failure to comply may result in a warning, temporary suspension, or permanent termination.",
      },
      {
        titulo: "19. Prohibitions",
        contenido:
          "Sharing your account or password, accessing functions of another role, tampering with the system or compromising its security, or using the application for unlawful purposes is prohibited.",
      },
      {
        titulo: "20. Suspension and termination",
        contenido:
          "An account may be suspended for impersonation, breach of these terms, or violent or offensive behavior. An expired membership does not suspend the account; it only denies access to the gym. The manager terminates staff accounts and their data is deleted.",
      },
      {
        titulo: "21. Health and physical condition",
        contenido:
          "Physical activity involves risks. Consult a physician before training and inform your instructors of any relevant condition. Upon registration, reception or the manager records your date of birth, blood type, allergies, medical conditions or injuries, and medications solely to respond to an emergency; some of these items may remain unspecified. The application does not replace medical advice or track your physical progress.",
      },
      {
        titulo: "22. Service availability",
        contenido:
          "The application depends on an internet connection, device camera, and cloud service; therefore, uninterrupted operation is not guaranteed.",
      },
      {
        titulo: "23. Personal data",
        contenido: "The processing of your personal data is governed by the Privacy Policy.",
      },
      {
        titulo: "24. Notices and modifications",
        contenido:
          "Notices are sent by email and, when applicable, through the application and at the facility. Changes to these terms, prices, or policies are notified at least 15 calendar days in advance, and closures or schedule changes at least 3 days in advance. You must keep your email address up to date.",
      },
      {
        titulo: "25. Governing law",
        contenido: "These terms are governed by the laws of the United Mexican States.",
      },
      {
        titulo: "26. Contact",
        contenido: "Phone: +52 314 139 7633. Email: xcobian@ucol.mx.",
      },
    ],
  },
};

export default function Terminos() {
  const { idioma, tr } = useIdioma();
  const navigate = useNavigate();
  const location = useLocation();
  // Vuelve a la pantalla de la que venía (inicio o login). Si se abrió directo, va al inicio.
  const volver = (e) => {
    e.preventDefault();
    if (location.key !== "default") navigate(-1);
    else navigate("/");
  };
  const doc = TERMINOS[idioma] || TERMINOS.es;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-[var(--c-fondo)]">
      <FondoGym />
      <BotonIdioma className="absolute top-4 left-4 z-10" />
      <BotonTema className="absolute top-4 right-4 z-10" />

      <div className="fx-borde relative z-10 w-full max-w-3xl">
        <div className="fx-cristal rounded-[calc(1rem-1.5px)] p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-4">
            <img
              src="/logo_final.webp"
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
