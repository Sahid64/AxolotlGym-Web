import { createContext, useContext, useEffect, useState } from "react";

const IdiomaContext = createContext(null);

const textos = {
  es: {
    // General / Tema / Idioma
    cambiarIdioma: "English",
    etiquetaIdioma: "Cambiar idioma",
    temaOscuro: "Tema oscuro",
    temaClaro: "Tema claro",
    sinResultados: "Sin resultados",
    acciones: "Acciones",
    editar: "Editar",
    eliminar: "Eliminar",
    renovar: "Renovar",
    desactivar: "Desactivar",
    darDeBaja: "Dar de baja",
    guardarCambios: "Guardar cambios",
    cancelar: "Cancelar",
    confirmar: "Confirmar",
    todos: "Todos",
    volverLogin: "← Volver al inicio de sesión",
    mostrarPassword: "Mostrar contraseña",
    ocultarPassword: "Ocultar contraseña",

    // Estados y Roles
    estados: {
      activo: "activo",
      inactivo: "inactivo",
      pendiente: "pendiente",
      aprobada: "aprobada",
      rechazada: "rechazada",
      cancelada: "cancelada",
    },
    roles: {
      recepcion: "Recepción",
      encargado: "Encargado",
      dueno: "Dueño",
      instructor: "Instructor",
      cliente: "Cliente",
    },

    // Fondo animado
    palabrasFondo: "SUDOR · DISCIPLINA · FUERZA · CONSTANCIA · RESULTADOS · ",

    // Login
    login: {
      subtitulo: "Acceso para recepción / encargado",
      correo: "Correo",
      password: "Contraseña",
      ingresando: "Ingresando...",
      ingresar: "Ingresar",
      soloStaff: "Este acceso web es solo para recepción y encargado/dueño",
      errorDefault: "No se pudo iniciar sesión",
      acepto: "Acepto los",
      terminosLink: "Términos y Condiciones",
      yLas: "y las",
      privacidadLink: "Políticas de Privacidad",
      errorTerminos: "Debes aceptar los Términos y Condiciones y las Políticas de Privacidad para ingresar",
    },

    // Páginas legales (Términos y Privacidad)
    legal: {
      terminosTitulo: "Términos y Condiciones",
      terminosSubtitulo: "AXOLOTL GYM — Condiciones de uso del sistema",
      terminosPendiente: "Apartado listo para ingresar los Términos y Condiciones de Axolotl Gym.",
      privacidadTitulo: "Políticas de Privacidad",
      privacidadSubtitulo: "AXOLOTL GYM — Protección y tratamiento de datos personales",
      privacidadPendiente: "Apartado listo para ingresar las Políticas de Privacidad de Axolotl Gym.",
    },

    // Sidebar y Confirmación de Cierre de Sesión
    menu: {
      escanearQr: "Acceso",
      clientes: "Clientes",
      solicitudes: "Solicitudes",
      pagos: "Pagos",
      dashboard: "Dashboard",
      personal: "Personal",
      servicios: "Servicios",
      gastos: "Gastos",
      reportes: "Reportes",
      cerrarSesion: "Cerrar sesión",
      confirmarSalidaTitulo: "Confirmar cierre de sesión",
      confirmarSalidaMsg: "¿Estás seguro de que deseas cerrar tu sesión actual?",
      confirmarSalidaBtn: "Sí, cerrar sesión",
    },

    // Acceso y Clientes Dentro (Recepción)
    qr: {
      titulo: "Control de acceso",
      escanearCodigo: "Escanear código",
      abriendoCamara: "Abriendo cámara...",
      camaraApagada: "La cámara está apagada",
      encenderCamara: "Encender cámara",
      errorCamara: "No se pudo abrir la cámara. Revisa que el navegador tenga permiso para usarla.",
      reintentar: "Reintentar",
      apagarCamara: "Apagar cámara",
      infoCliente: "Información del cliente",
      instruccionEscaneo: "Escanea un código para ver la información del cliente",
      membresia: "Membresía",
      estado: "Estado",
      registro: "Registro",
      entrada: "Entrada",
      salida: "Salida",
      codigoNoReconocido: "Código no reconocido",
      errorConsulta: "No se pudo consultar al cliente",
      membresiaVencida: "Membresía vencida. Pasa a renovar",
      entradaRegistrada: "Entrada registrada",
      salidaRegistrada: "Salida registrada",
      errorRegistrar: "Error al registrar",
      dentroTitulo: "Clientes dentro del gimnasio",
      dentroBadge: (n) => `Dentro: ${n}`,
      sinClientesDentro: "Actualmente no hay clientes registrados dentro del gimnasio.",
      desdeHora: (h) => `Entrada: ${h}`,
      sacarManualBtn: "Registrar salida",
      confirmarSalidaManualTitulo: "Confirmar salida manual",
      confirmarSalidaManualMsg: (nombre) =>
        `¿Deseas registrar manualmente la salida de ${nombre} (por retiro de servicio o salida no marcada)?`,
      confirmarSalidaManualBtn: "Sí, registrar salida",
      actualizarLista: "Actualizar",
    },

    // Clientes
    clientes: {
      titulo: "Clientes",
      nuevoBtn: "+ Nuevo cliente",
      buscarPlaceholder: "Buscar por nombre o membresía...",
      activo: "Activo",
      inactivo: "Inactivo",
      sinPlan: "Sin plan",
      colFoto: "Foto",
      colNombre: "Nombre",
      colMembresia: "Membresía",
      colPlan: "Plan",
      colFechaRegistro: "Fecha registro",
      colEstado: "Estado",
      modalEditar: "Editar cliente",
      modalNuevo: "Nuevo cliente",
      modalRenovar: "Renovar membresía",
      nombre: "Nombre",
      apellido: "Apellido",
      telefono: "Teléfono",
      correo: "Correo",
      plan: "Plan",
      seleccionaPlan: "Selecciona un plan",
      metodoPago: "Método de pago",
      metodos: {
        Efectivo: "Efectivo",
        Tarjeta: "Tarjeta",
        Transferencia: "Transferencia",
      },
      comprobanteLabel: "Comprobante de transferencia (imagen)",
      subirComprobante: "Seleccionar imagen del comprobante",
      cambiarComprobante: "Cambiar imagen",
      avisoTransferencia:
        "Al pagar por transferencia, el comprobante será enviado a Pagos para que el Encargado lo acepte o rechace.",
      faltaComprobante: "Debes subir la imagen del comprobante de transferencia",
      guardarNuevo: "Guardar cliente",
      errorGuardar: "No se pudo guardar",
      errorRenovar: "No se pudo renovar",
      membresiaRenovada: "Membresía renovada",
      confirmarGuardarTitulo: "Confirmar datos del cliente",
      confirmarCrearMsg: "¿Estás seguro de que deseas registrar a este nuevo cliente?",
      confirmarEditarMsg: "¿Estás seguro de que deseas guardar los cambios de este cliente?",
      confirmarRenovarMsg: (nombre) => `Selecciona el plan y método de pago para renovar a ${nombre}:`,
      confirmarRenovarBtn: "Confirmar renovación",
      // Recepción: Desactivar estatus y quitar plan
      modalDesactivarTitulo: "Desactivar cliente y retirar plan",
      modalDesactivarMsg: (nombre) =>
        `¿Estás seguro de que deseas desactivar el estatus de ${nombre} y quitarle su plan activo? El cliente no podrá ingresar hasta renovar su membresía.`,
      confirmarDesactivarBtn: "Sí, desactivar",
      // Encargado: Dar de baja (Suspensión vs Derechos ARCO)
      modalBajaTitulo: "Dar de baja al cliente",
      modalBajaSubtitulo: (nombre) => `Selecciona el procedimiento de baja para ${nombre}:`,
      bajaOpcionSuspensionTitulo: "Baja / Suspensión conforme a Términos y Políticas",
      bajaOpcionSuspensionDesc:
        "Se desactiva la cuenta y se retira su plan activo. Sus datos se eliminarán de forma automática tras 365 días de inactividad, conservando únicamente los registros de pagos con fines contables y fiscales.",
      bajaOpcionArcoTitulo: "Derechos ARCO / Revocación de consentimiento (Eliminar datos)",
      bajaOpcionArcoDesc:
        "El cliente solicitó revocar su consentimiento y eliminar todos sus datos personales de inmediato. Solo se conservarán los registros de pagos con fines contables y fiscales.",
      confirmarBajaBtn: "Confirmar baja",
      errorBaja: "No se pudo procesar la baja del cliente",
    },

    // Pagos
    pagos: {
      titulo: "Pagos",
      pendientes: (n) => `Pendientes de validar: ${n}`,
      sinPendientes: "No hay pagos pendientes por validar.",
      planLabel: "Plan",
      enviadoEl: "enviado el",
      cargandoComprobante: "Cargando comprobante…",
      sinComprobante: "Sin comprobante (registrado en Recepción)",
      errorComprobante: "No se pudo cargar el comprobante",
      soloEncargadoImg: "Comprobante de pago (solo lo ve el Encargado)",
      clicAmpliar: "Haz clic en la imagen para ampliarla",
      rechazar: "Rechazar",
      aceptar: "Aceptar",
      soloEncargadoValidar: "Las transferencias las valida el Encargado.",
      modalAceptarTitulo: "Aceptar pago",
      modalRechazarTitulo: "Rechazar pago",
      confirmarAceptarMsg: (monto, cliente) =>
        `¿Validar el pago de ${monto} de ${cliente}? Se sumará a los ingresos de hoy y se activará su membresía.`,
      confirmarRechazarMsg: (cliente) =>
        `¿Rechazar el pago de ${cliente}? No se sumará a los ingresos y el cliente verá el motivo en su pestaña Pagos.`,
      motivoRechazo: "Motivo del rechazo",
      motivoPlaceholder: "Ej. El monto no coincide con el plan",
      comprobanteModalTitulo: "Comprobante de pago",
      pagoValidadoMsg: (cliente) => `Pago de ${cliente} validado. Su membresía quedó activa.`,
      pagoRechazadoMsg: (cliente) => `Pago de ${cliente} rechazado.`,
      errorCargar: "No se pudo cargar",
      errorGuardar: "No se pudo guardar",
    },

    // Solicitudes
    solicitudes: {
      titulo: "Solicitudes",
      colCliente: "Cliente",
      colInstructor: "Instructor",
      colCosto: "Costo",
      colFecha: "Fecha",
      colEstado: "Estado",
      aprobar: "Aprobar",
      rechazar: "Rechazar",
      sinAcciones: "Sin acciones",
      confirmarAprobarTitulo: "Confirmar aprobación",
      confirmarRechazarTitulo: "Confirmar rechazo",
      confirmarAprobarMsg: (cliente, instructor) =>
        `¿Estás seguro de que deseas aprobar la solicitud de asesoría de ${cliente} con ${instructor}?`,
      confirmarRechazarMsg: (cliente, instructor) =>
        `¿Estás seguro de que deseas rechazar la solicitud de asesoría de ${cliente} con ${instructor}?`,
    },

    // Dashboard
    dashboard: {
      titulo: "Dashboard",
      clientesActivos: "Clientes activos",
      clientesInactivos: "Clientes inactivos",
      ingresosMes: "Ingresos del mes",
      ocupacionHora: "Ocupación por hora (personas dentro)",
      personas: "Personas",
      clientes12Meses: "Clientes activos / inactivos (12 meses)",
      activos: "Activos",
      inactivos: "Inactivos",
      entradasDia: "Entradas por día de la semana",
      entradas: "Entradas",
      mesesCortos: {
        Ene: "Ene", Feb: "Feb", Mar: "Mar", Abr: "Abr", May: "May", Jun: "Jun",
        Jul: "Jul", Ago: "Ago", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dic: "Dic",
      },
      diasCortos: {
        Lun: "Lun", Mar: "Mar", Mie: "Mié", Jue: "Jue", Vie: "Vie", Sab: "Sáb", Dom: "Dom",
      },
    },

    // Personal
    personal: {
      titulo: "Personal",
      nuevoBtn: "+ Agregar personal",
      buscarPlaceholder: "Buscar por nombre o correo...",
      todosRoles: "Todos los roles",
      colNombre: "Nombre",
      colRol: "Rol",
      colCorreo: "Correo",
      colEstado: "Estado",
      modalEditar: "Editar personal",
      modalNuevo: "Agregar personal",
      nombre: "Nombre",
      telefono: "Teléfono",
      correoLogin: "Correo (con el que inicia sesión)",
      passwordInicial: "Contraseña inicial",
      rol: "Rol",
      estado: "Estado",
      activo: "Activo",
      inactivo: "Inactivo",
      costoServicio: "Costo del servicio",
      capacidadMaxima: "Capacidad máxima de clientes",
      guardarNuevo: "Agregar al personal",
      errorGuardar: "No se pudo guardar",
      errorEliminar: "No se pudo eliminar",
      confirmarGuardarTitulo: "Confirmar datos del personal",
      confirmarCrearMsg: "¿Estás seguro de que deseas agregar a esta persona al personal?",
      confirmarEditarMsg: "¿Estás seguro de que deseas guardar los cambios de este integrante del personal?",
      confirmarEliminarTitulo: "Confirmar eliminación",
      confirmarEliminarMsg: (nombre) => `¿Estás seguro de que deseas eliminar a ${nombre} del personal?`,
      confirmarEliminarBtn: "Sí, eliminar",
    },

    // Servicios
    servicios: {
      titulo: "Servicios",
      nuevoBtn: "+ Nuevo servicio",
      colNombre: "Nombre",
      colDuracion: "Duración",
      colPrecio: "Precio",
      modalEditar: "Editar servicio",
      modalNuevo: "Nuevo servicio",
      nombre: "Nombre",
      duracion: "Duración",
      duracionPlaceholder: "ej. 1 mes",
      precio: "Precio",
      guardarNuevo: "Guardar servicio",
      errorGuardar: "No se pudo guardar el servicio",
      errorEliminar: "No se pudo eliminar el servicio",
      confirmarGuardarTitulo: "Confirmar datos del servicio",
      confirmarCrearMsg: "¿Estás seguro de que deseas registrar este nuevo servicio?",
      confirmarEditarMsg: "¿Estás seguro de que deseas guardar los cambios de este servicio?",
      confirmarEliminarTitulo: "Confirmar eliminación de servicio",
      confirmarEliminarMsg: (nombre) =>
        `¿Estás seguro de que deseas eliminar el servicio "${nombre}"? Ya no aparecerá al registrar o renovar clientes.`,
      confirmarEliminarBtn: "Sí, eliminar",
    },

    // Gastos
    gastos: {
      titulo: "Gastos",
      nuevoBtn: "+ Nuevo gasto",
      colConcepto: "Concepto",
      colCategoria: "Categoría",
      colMonto: "Monto",
      colFecha: "Fecha",
      modalEditar: "Editar gasto",
      modalNuevo: "Nuevo gasto",
      concepto: "Concepto",
      categoria: "Categoría",
      monto: "Monto",
      fecha: "Fecha",
      guardarNuevo: "Guardar gasto",
      errorGuardar: "No se pudo guardar el gasto",
      errorEliminar: "No se pudo eliminar el gasto",
      confirmarGuardarTitulo: "Confirmar datos del gasto",
      confirmarCrearMsg: "¿Estás seguro de que deseas registrar este nuevo gasto?",
      confirmarEditarMsg: "¿Estás seguro de que deseas guardar los cambios de este gasto?",
      confirmarEliminarTitulo: "Confirmar eliminación de gasto",
      confirmarEliminarMsg: (concepto) => `¿Estás seguro de que deseas eliminar el gasto "${concepto}"?`,
      confirmarEliminarBtn: "Sí, eliminar",
    },

    // Reportes
    reportes: {
      titulo: "Reportes mensuales",
      colPeriodo: "Periodo",
      colServicio: "Servicio",
      colAsesorias: "Asesorías",
      colGastos: "Gastos",
      colTotal: "Total",
      meses: [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ],
    },

    // Validaciones
    val: {
      esObligatorio: (campo) => `${campo} es obligatorio`,
      minLetras: (campo) => `${campo}: mínimo 3 letras`,
      soloLetras: (campo) => `${campo}: solo letras`,
      minCaracteres: (campo) => `${campo}: mínimo 3 caracteres`,
      soloLetrasNumeros: (campo) => `${campo}: solo letras y números`,
      telefono10: "El teléfono debe tener 10 dígitos",
      correoObligatorio: "El correo es obligatorio",
      correoInvalido: "Correo no válido",
      seleccionaPlan: "Selecciona un plan",
      passwordObligatoria: "La contraseña es obligatoria",
      passwordMin8: "Mínimo 8 caracteres",
      numeroMayorCero: (campo) => `${campo} debe ser un número mayor a 0`,
      enteroMayorCero: (campo) => `${campo} debe ser un entero mayor a 0`,
      fechaObligatoria: "La fecha es obligatoria",
      fechaFutura: "La fecha no puede ser futura",
    },
  },

  en: {
    // General / Theme / Language
    cambiarIdioma: "Español",
    etiquetaIdioma: "Change language",
    temaOscuro: "Dark theme",
    temaClaro: "Light theme",
    sinResultados: "No results",
    acciones: "Actions",
    editar: "Edit",
    eliminar: "Delete",
    renovar: "Renew",
    desactivar: "Deactivate",
    darDeBaja: "Terminate",
    guardarCambios: "Save changes",
    cancelar: "Cancel",
    confirmar: "Confirm",
    todos: "All",
    volverLogin: "← Back to sign in",
    mostrarPassword: "Show password",
    ocultarPassword: "Hide password",

    // Statuses and Roles
    estados: {
      activo: "active",
      inactivo: "inactive",
      pendiente: "pending",
      aprobada: "approved",
      rechazada: "rejected",
      cancelada: "cancelled",
    },
    roles: {
      recepcion: "Reception",
      encargado: "Manager",
      dueno: "Owner",
      instructor: "Instructor",
      cliente: "Client",
    },

    // Animated background
    palabrasFondo: "SWEAT · DISCIPLINE · STRENGTH · CONSISTENCY · RESULTS · ",

    // Login
    login: {
      subtitulo: "Reception / Manager access",
      correo: "Email",
      password: "Password",
      ingresando: "Signing in...",
      ingresar: "Sign in",
      soloStaff: "This web access is only for reception and manager/owner",
      errorDefault: "Could not sign in",
      acepto: "I accept the",
      terminosLink: "Terms and Conditions",
      yLas: "and the",
      privacidadLink: "Privacy Policy",
      errorTerminos: "You must accept the Terms and Conditions and Privacy Policy to sign in",
    },

    // Legal pages (Terms & Privacy)
    legal: {
      terminosTitulo: "Terms and Conditions",
      terminosSubtitulo: "AXOLOTL GYM — System terms of use",
      terminosPendiente: "Section ready to insert Axolotl Gym's Terms and Conditions.",
      privacidadTitulo: "Privacy Policy",
      privacidadSubtitulo: "AXOLOTL GYM — Personal data protection and processing",
      privacidadPendiente: "Section ready to insert Axolotl Gym's Privacy Policy.",
    },

    // Sidebar & Logout confirmation
    menu: {
      escanearQr: "Access",
      clientes: "Clients",
      solicitudes: "Requests",
      pagos: "Payments",
      dashboard: "Dashboard",
      personal: "Staff",
      servicios: "Services",
      gastos: "Expenses",
      reportes: "Reports",
      cerrarSesion: "Sign out",
      confirmarSalidaTitulo: "Confirm sign out",
      confirmarSalidaMsg: "Are you sure you want to sign out of your current session?",
      confirmarSalidaBtn: "Yes, sign out",
    },

    // Access & Clients Inside (Reception)
    qr: {
      titulo: "Access control",
      escanearCodigo: "Scan code",
      abriendoCamara: "Opening camera...",
      camaraApagada: "Camera is off",
      encenderCamara: "Turn on camera",
      errorCamara: "Could not open camera. Check browser permissions.",
      reintentar: "Retry",
      apagarCamara: "Turn off camera",
      infoCliente: "Client information",
      instruccionEscaneo: "Scan a code to view client information",
      membresia: "Membership",
      estado: "Status",
      registro: "Registered",
      entrada: "Check-in",
      salida: "Check-out",
      codigoNoReconocido: "Unrecognized code",
      errorConsulta: "Could not fetch client",
      membresiaVencida: "Expired membership. Please renew",
      entradaRegistrada: "Check-in registered",
      salidaRegistrada: "Check-out registered",
      errorRegistrar: "Error registering",
      dentroTitulo: "Clients currently inside the gym",
      dentroBadge: (n) => `Inside: ${n}`,
      sinClientesDentro: "There are currently no clients checked into the gym.",
      desdeHora: (h) => `Checked in: ${h}`,
      sacarManualBtn: "Check out",
      confirmarSalidaManualTitulo: "Confirm manual check-out",
      confirmarSalidaManualMsg: (nombre) =>
        `Do you want to manually check out ${nombre} (due to service withdrawal or missed check-out)?`,
      confirmarSalidaManualBtn: "Yes, check out",
      actualizarLista: "Refresh",
    },

    // Clients
    clientes: {
      titulo: "Clients",
      nuevoBtn: "+ New client",
      buscarPlaceholder: "Search by name or membership...",
      activo: "Active",
      inactivo: "Inactive",
      sinPlan: "No plan",
      colFoto: "Photo",
      colNombre: "Name",
      colMembresia: "Membership",
      colPlan: "Plan",
      colFechaRegistro: "Registration date",
      colEstado: "Status",
      modalEditar: "Edit client",
      modalNuevo: "New client",
      modalRenovar: "Renew membership",
      nombre: "First name",
      apellido: "Last name",
      telefono: "Phone",
      correo: "Email",
      plan: "Plan",
      seleccionaPlan: "Select a plan",
      metodoPago: "Payment method",
      metodos: {
        Efectivo: "Cash",
        Tarjeta: "Card",
        Transferencia: "Bank transfer",
      },
      comprobanteLabel: "Transfer receipt (image)",
      subirComprobante: "Select receipt image",
      cambiarComprobante: "Change image",
      avisoTransferencia:
        "When paying by transfer, the receipt will be sent to Payments for the Manager to accept or reject.",
      faltaComprobante: "You must upload the transfer receipt image",
      guardarNuevo: "Save client",
      errorGuardar: "Could not save",
      errorRenovar: "Could not renew",
      membresiaRenovada: "Membership renewed",
      confirmarGuardarTitulo: "Confirm client details",
      confirmarCrearMsg: "Are you sure you want to register this new client?",
      confirmarEditarMsg: "Are you sure you want to save the changes for this client?",
      confirmarRenovarMsg: (nombre) => `Select the plan and payment method to renew ${nombre}:`,
      confirmarRenovarBtn: "Confirm renewal",
      // Reception: Deactivate status and remove plan
      modalDesactivarTitulo: "Deactivate client and remove plan",
      modalDesactivarMsg: (nombre) =>
        `Are you sure you want to deactivate ${nombre}'s status and remove their active plan? The client will not be able to enter until renewing their membership.`,
      confirmarDesactivarBtn: "Yes, deactivate",
      // Manager: Terminate (Suspension vs ARCO Rights)
      modalBajaTitulo: "Terminate client",
      modalBajaSubtitulo: (nombre) => `Select the termination procedure for ${nombre}:`,
      bajaOpcionSuspensionTitulo: "Termination / Suspension under Terms & Policies",
      bajaOpcionSuspensionDesc:
        "Deactivates the account and removes the active plan. Personal data will be automatically deleted after 365 days of inactivity, retaining only payment records for accounting and tax purposes.",
      bajaOpcionArcoTitulo: "ARCO Rights / Consent Revocation (Delete personal data)",
      bajaOpcionArcoDesc:
        "The client requested to revoke consent and immediately delete all personal data. Only payment records will be retained for accounting and tax purposes.",
      confirmarBajaBtn: "Confirm termination",
      errorBaja: "Could not process client termination",
    },

    // Payments
    pagos: {
      titulo: "Payments",
      pendientes: (n) => `Pending validation: ${n}`,
      sinPendientes: "No pending payments to validate.",
      planLabel: "Plan",
      enviadoEl: "sent on",
      cargandoComprobante: "Loading receipt…",
      sinComprobante: "No receipt (registered at Reception)",
      errorComprobante: "Could not load receipt",
      soloEncargadoImg: "Payment receipt (visible only to Manager)",
      clicAmpliar: "Click image to enlarge",
      rechazar: "Reject",
      aceptar: "Accept",
      soloEncargadoValidar: "Bank transfers are validated by the Manager.",
      modalAceptarTitulo: "Accept payment",
      modalRechazarTitulo: "Reject payment",
      confirmarAceptarMsg: (monto, cliente) =>
        `Validate the payment of ${monto} from ${cliente}? It will be added to today's revenue and activate their membership.`,
      confirmarRechazarMsg: (cliente) =>
        `Reject the payment from ${cliente}? It will not be added to revenue and the client will see the reason in their Payments tab.`,
      motivoRechazo: "Rejection reason",
      motivoPlaceholder: "E.g. Amount does not match the plan",
      comprobanteModalTitulo: "Payment receipt",
      pagoValidadoMsg: (cliente) => `Payment from ${cliente} validated. Membership is now active.`,
      pagoRechazadoMsg: (cliente) => `Payment from ${cliente} rejected.`,
      errorCargar: "Could not load",
      errorGuardar: "Could not save",
    },

    // Requests
    solicitudes: {
      titulo: "Requests",
      colCliente: "Client",
      colInstructor: "Instructor",
      colCosto: "Cost",
      colFecha: "Date",
      colEstado: "Status",
      aprobar: "Approve",
      rechazar: "Reject",
      sinAcciones: "No actions",
      confirmarAprobarTitulo: "Confirm approval",
      confirmarRechazarTitulo: "Confirm rejection",
      confirmarAprobarMsg: (cliente, instructor) =>
        `Are you sure you want to approve the coaching request from ${cliente} with ${instructor}?`,
      confirmarRechazarMsg: (cliente, instructor) =>
        `Are you sure you want to reject the coaching request from ${cliente} with ${instructor}?`,
    },

    // Dashboard
    dashboard: {
      titulo: "Dashboard",
      clientesActivos: "Active clients",
      clientesInactivos: "Inactive clients",
      ingresosMes: "Monthly revenue",
      ocupacionHora: "Hourly occupancy (people inside)",
      personas: "People",
      clientes12Meses: "Active / inactive clients (12 months)",
      activos: "Active",
      inactivos: "Inactive",
      entradasDia: "Check-ins by day of the week",
      entradas: "Check-ins",
      mesesCortos: {
        Ene: "Jan", Feb: "Feb", Mar: "Mar", Abr: "Apr", May: "May", Jun: "Jun",
        Jul: "Jul", Ago: "Aug", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dic: "Dec",
      },
      diasCortos: {
        Lun: "Mon", Mar: "Tue", Mie: "Wed", Jue: "Thu", Vie: "Fri", Sab: "Sat", Dom: "Sun",
      },
    },

    // Staff
    personal: {
      titulo: "Staff",
      nuevoBtn: "+ Add staff",
      buscarPlaceholder: "Search by name or email...",
      todosRoles: "All roles",
      colNombre: "Name",
      colRol: "Role",
      colCorreo: "Email",
      colEstado: "Status",
      modalEditar: "Edit staff",
      modalNuevo: "Add staff",
      nombre: "Name",
      telefono: "Phone",
      correoLogin: "Email (used to sign in)",
      passwordInicial: "Initial password",
      rol: "Role",
      estado: "Status",
      activo: "Active",
      inactivo: "Inactive",
      costoServicio: "Service cost",
      capacidadMaxima: "Max client capacity",
      guardarNuevo: "Add staff",
      errorGuardar: "Could not save",
      errorEliminar: "Could not delete",
      confirmarGuardarTitulo: "Confirm staff details",
      confirmarCrearMsg: "Are you sure you want to add this person to the staff?",
      confirmarEditarMsg: "Are you sure you want to save the changes for this staff member?",
      confirmarEliminarTitulo: "Confirm deletion",
      confirmarEliminarMsg: (nombre) => `Are you sure you want to remove ${nombre} from the staff?`,
      confirmarEliminarBtn: "Yes, delete",
    },

    // Services
    servicios: {
      titulo: "Services",
      nuevoBtn: "+ New service",
      colNombre: "Name",
      colDuracion: "Duration",
      colPrecio: "Price",
      modalEditar: "Edit service",
      modalNuevo: "New service",
      nombre: "Name",
      duracion: "Duration",
      duracionPlaceholder: "e.g. 1 month",
      precio: "Price",
      guardarNuevo: "Save service",
      errorGuardar: "Could not save service",
      errorEliminar: "Could not delete service",
      confirmarGuardarTitulo: "Confirm service details",
      confirmarCrearMsg: "Are you sure you want to register this new service?",
      confirmarEditarMsg: "Are you sure you want to save the changes for this service?",
      confirmarEliminarTitulo: "Confirm service deletion",
      confirmarEliminarMsg: (nombre) =>
        `Are you sure you want to delete the service "${nombre}"? It will no longer appear when registering or renewing clients.`,
      confirmarEliminarBtn: "Yes, delete",
    },

    // Expenses
    gastos: {
      titulo: "Expenses",
      nuevoBtn: "+ New expense",
      colConcepto: "Concept",
      colCategoria: "Category",
      colMonto: "Amount",
      colFecha: "Date",
      modalEditar: "Edit expense",
      modalNuevo: "New expense",
      concepto: "Concept",
      categoria: "Category",
      monto: "Amount",
      fecha: "Date",
      guardarNuevo: "Save expense",
      errorGuardar: "Could not save expense",
      errorEliminar: "Could not delete expense",
      confirmarGuardarTitulo: "Confirm expense details",
      confirmarCrearMsg: "Are you sure you want to record this new expense?",
      confirmarEditarMsg: "Are you sure you want to save the changes for this expense?",
      confirmarEliminarTitulo: "Confirm expense deletion",
      confirmarEliminarMsg: (concepto) => `Are you sure you want to delete the expense "${concepto}"?`,
      confirmarEliminarBtn: "Yes, delete",
    },

    // Reports
    reportes: {
      titulo: "Monthly reports",
      colPeriodo: "Period",
      colServicio: "Services",
      colAsesorias: "Coaching",
      colGastos: "Expenses",
      colTotal: "Total",
      meses: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ],
    },

    // Validations
    val: {
      esObligatorio: (campo) => `${campo} is required`,
      minLetras: (campo) => `${campo}: minimum 3 letters`,
      soloLetras: (campo) => `${campo}: letters only`,
      minCaracteres: (campo) => `${campo}: minimum 3 characters`,
      soloLetrasNumeros: (campo) => `${campo}: letters and numbers only`,
      telefono10: "Phone must be 10 digits",
      correoObligatorio: "Email is required",
      correoInvalido: "Invalid email",
      seleccionaPlan: "Select a plan",
      passwordObligatoria: "Password is required",
      passwordMin8: "Minimum 8 characters",
      numeroMayorCero: (campo) => `${campo} must be a number greater than 0`,
      enteroMayorCero: (campo) => `${campo} must be an integer greater than 0`,
      fechaObligatoria: "Date is required",
      fechaFutura: "Date cannot be in the future",
    },
  },
};

// Traduce avisos y errores que llegan en español desde el backend / Supabase
function traducirMensajeServidor(msg, idioma) {
  if (!msg || idioma !== "en") return msg;
  const texto = String(msg);

  const exactos = {
    "Correo o contraseña incorrectos": "Incorrect email or password",
    "Los clientes ingresan desde la app Axolotl": "Clients sign in from the Axolotl app",
    "Membresia o contraseña incorrectos": "Incorrect membership or password",
    "Cliente registrado. Contraseña temporal: Axolotl2026": "Client registered. Temporary password: Axolotl2026",
    "Membresia renovada": "Membership renewed",
    "Comprobante enviado. Pendiente de validación por el Encargado":
      "Receipt submitted. Pending validation by the Manager",
    "Falta la imagen del comprobante": "Receipt image is required",
    "Cliente desactivado": "Client deactivated",
    "Cliente desactivado y plan retirado": "Client deactivated and plan removed",
    "Cliente dado de baja conforme a términos y políticas":
      "Client terminated in accordance with terms and policies",
    "Datos personales del cliente eliminados por Derechos ARCO":
      "Client personal data deleted under ARCO Rights",
    "Se agrego al personal": "Staff member added",
    "Se agrego al personal. Contraseña temporal: Axolotl2026": "Staff member added. Temporary password: Axolotl2026",
    "Se elimino del personal": "Staff member removed",
    "Solicitud aprobada": "Request approved",
    "Solicitud rechazada": "Request rejected",
    "Membresia vencida. Pasa a renovar": "Expired membership. Please renew",
    "Movimiento repetido, espera unos segundos": "Repeated action, please wait a few seconds",
    "Membresia no encontrada": "Membership not found",
    "Codigo no valido": "Invalid code",
    "Cliente no valido": "Invalid client",
    "Cliente no encontrado": "Client not found",
    "Plan no válido": "Invalid plan",
    "Pago validado": "Payment validated",
    "Pago rechazado": "Payment rejected",
    "Escribe el motivo del rechazo": "Please enter the rejection reason",
    "Servicio eliminado": "Service deleted",
    "Gasto eliminado": "Expense deleted",
    "El cliente no tiene plan previo; indica uno": "Client has no previous plan; please select one",
  };
  if (exactos[texto]) return exactos[texto];

  // Mensajes dinamicos de QR / bloqueo
  let m = /^Bienvenido (.+)$/i.exec(texto);
  if (m) return `Welcome ${m[1]}`;

  m = /^Hasta pronto (.+)$/i.exec(texto);
  if (m) return `See you soon ${m[1]}`;

  m = /^(.+) ya tiene una entrada registrada$/i.exec(texto);
  if (m) return `${m[1]} already has a check-in registered`;

  m = /^(.+) no tiene una entrada registrada hoy$/i.exec(texto);
  if (m) return `${m[1]} has no check-in registered today`;

  m = /^Cuenta bloqueada temporalmente\. Intenta de nuevo en (\d+) min$/i.exec(texto);
  if (m) return `Account temporarily locked. Try again in ${m[1]} min`;

  return texto;
}

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    const guardado = localStorage.getItem("idioma");
    return guardado === "en" ? "en" : "es";
  });

  useEffect(() => {
    document.documentElement.lang = idioma;
    localStorage.setItem("idioma", idioma);
  }, [idioma]);

  const alternarIdioma = () => setIdioma((actual) => (actual === "es" ? "en" : "es"));
  const tr = textos[idioma] || textos.es;
  const traducirMsg = (msg) => traducirMensajeServidor(msg, idioma);

  // Traduce nombres de planes/servicios comunes al inglés cuando idioma === "en"
  const traducirPlan = (plan) => {
    if (!plan || idioma !== "en") return plan;
    const mapa = {
      mensualidad: "Monthly",
      mensual: "Monthly",
      trimestral: "Quarterly",
      semestral: "Semiannual",
      anual: "Annual",
      anualidad: "Annual",
      semanal: "Weekly",
      quincenal: "Biweekly",
      visita: "Day pass",
    };
    const clave = String(plan).trim().toLowerCase();
    return mapa[clave] || plan;
  };

  // Traduce duraciones como "30 días", "1 día", "3 meses", "1 año" al inglés
  const traducirDuracion = (dur) => {
    if (!dur || idioma !== "en") return dur;
    return String(dur)
      .replace(/\bdías\b|\bdias\b/gi, "days")
      .replace(/\bdía\b|\bdia\b/gi, "day")
      .replace(/\bmeses\b/gi, "months")
      .replace(/\bmes\b/gi, "month")
      .replace(/\bsemanas\b/gi, "weeks")
      .replace(/\bsemana\b/gi, "week")
      .replace(/\baños\b|\banos\b/gi, "years")
      .replace(/\baño\b|\bano\b/gi, "year");
  };

  return (
    <IdiomaContext.Provider
      value={{
        idioma,
        esIngles: idioma === "en",
        alternarIdioma,
        tr,
        traducirMsg,
        traducirPlan,
        traducirDuracion,
      }}
    >
      {children}
    </IdiomaContext.Provider>
  );
}

export const useIdioma = () => useContext(IdiomaContext);
