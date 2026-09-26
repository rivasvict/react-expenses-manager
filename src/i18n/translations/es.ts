import { Translations } from "./en";

/**
 * Spanish UI text. Typed as `Translations`, so a key missing from (or extra
 * to) ./en.ts fails the type check. See ./en.ts for the conventions.
 *
 * Glossary, kept consistent across screens: entry → movimiento, income →
 * ingreso, expense → gasto, bucket → límite (a bucket *is* a monthly
 * spending limit), allowance → asignación, fixed entry → movimiento fijo,
 * party → grupo, organizer → organizador, sync → sincronizar,
 * backup → copia de seguridad.
 *
 * Keep `nav.*` labels short (about ten characters): on phones the five tabs
 * share the width of the screen.
 */
const es: Translations = {
  // Shared words
  "common.cancel": "Cancelar",
  "common.expenses": "Gastos",
  "common.goBack": "Volver",
  "common.incomes": "Ingresos",
  "common.savings": "Ahorro",
  "common.submit": "Guardar",
  "common.summary": "Resumen",

  // Language names, in the current UI language (Settings screen)
  "language.en": "Inglés",
  "language.es": "Español",

  // Relative times and dates (dayjs format tokens for `time.dateFormat`)
  "time.justNow": "justo ahora",
  "time.minutesAgo_one": "hace 1 minuto",
  "time.minutesAgo_other": "hace {{count}} minutos",
  "time.hoursAgo_one": "hace 1 hora",
  "time.hoursAgo_other": "hace {{count}} horas",
  "time.daysAgo_one": "hace 1 día",
  "time.daysAgo_other": "hace {{count}} días",
  "time.dateFormat": "D MMM YYYY",

  // App bar
  "header.appName": "Control de Gastos",
  "header.logoTitle": "Logo de Control de Gastos",
  "nav.ariaLabel": "Navegación principal",
  "nav.home": "Inicio",
  "nav.categories": "Categorías",
  "nav.buckets": "Límites",
  "nav.fixedEntries": "Fijos",
  "nav.data": "Datos",
  "nav.dataManagement": "Gestión de datos",
  "accountChip.loggedOut": "Cuenta",
  "accountChip.loggedIn": "Cuenta: {{firstName}} {{lastName}}",
  "syncStatus.unknown": "Servidor de sincronización: comprobando…",
  "syncStatus.online": "Servidor de sincronización: en línea",
  "syncStatus.offline": "Servidor de sincronización: sin conexión",

  // Settings
  "settings.title": "Ajustes",
  "settings.language.title": "Idioma",
  "settings.language.description":
    "Elige el idioma en el que se muestra la aplicación. Tu elección se guarda en este dispositivo y se aplica al instante.",

  // First-run data disclaimer
  "dataDisclaimer.title": "Tus datos se quedan en este dispositivo",
  "dataDisclaimer.body":
    "Esta aplicación está pensada para validar el producto. Nada de lo que registres se guarda en otro lugar que no sea este dispositivo, y tus datos se conservan mientras no se borren los datos del navegador. Puedes descargar una copia de seguridad en cualquier momento desde Gestión de datos.",
  "dataDisclaimer.dontShowAgain": "No volver a mostrar este mensaje",
  "dataDisclaimer.confirm": "Entendido",

  // Month stepper
  "monthHeader.previous": "Mes anterior",
  "monthHeader.next": "Mes siguiente",

  // Dashboard
  "dashboard.pageTitle": "Balance mensual",
  "dashboard.addIncome": "Añadir ingreso",
  "dashboard.addExpenses": "Añadir gasto",

  // Add / edit entry form
  "entryForm.pageTitle.income": "Movimiento de ingreso",
  "entryForm.pageTitle.expense": "Movimiento de gasto",
  "entryForm.heading.add.income": "Nuevo ingreso",
  "entryForm.heading.add.expense": "Nuevo gasto",
  "entryForm.heading.edit.income": "Editar ingreso",
  "entryForm.heading.edit.expense": "Editar gasto",
  "entryForm.amount": "Importe",
  "entryForm.amountPlaceholder.income": "Introduce el importe del ingreso",
  "entryForm.amountPlaceholder.expense": "Introduce el importe del gasto",
  "entryForm.description": "Descripción",
  "entryForm.optional": "(opcional)",
  "entryForm.category": "Categoría",
  "entryForm.selectCategory": "Selecciona una categoría",
  "entryForm.recurring": "Recurrente (se aplica cada mes)",
  "entryForm.remove": "Eliminar movimiento",
  "entryForm.notFound": "No se encontró el movimiento",

  // Searchable category dropdown
  "categorySelect.searchPlaceholder": "Buscar categorías…",
  "categorySelect.searchLabel": "Buscar categorías",
  "categorySelect.noMatches": "Ninguna categoría coincide",

  // Entry lists
  "entriesSummary.empty": "Todavía no hay nada este mes.",
  "entries.count_one": "{{count}} movimiento",
  "entries.count_other": "{{count}} movimientos",
  "entriesReport.pageTitle": "Informe mensual",
  "entriesReport.total.incomes": "Total de ingresos",
  "entriesReport.total.expenses": "Total de gastos",
  "entriesReport.matching.incomes": "Ingresos que coinciden",
  "entriesReport.matching.expenses": "Gastos que coinciden",

  // Monthly summary
  "summary.pageTitle": "Resumen mensual",
  "summary.monthTotal": "Total de {{month}}",
  "summary.show": "Mostrar",
  "summary.showAll": "Todos los ingresos y gastos",
  "summary.filteredTitle": "Vista filtrada · ambas listas",
  "summary.filteredTotal": "Total filtrado · neto",

  // Filter & sort toolbar
  "toolbar.searchEntries": "Buscar movimientos",
  // The toolbar field is narrow; its accessible name stays the full label.
  "toolbar.searchPlaceholder": "Buscar",
  "toolbar.sortEntries": "Ordenar movimientos",
  "toolbar.sortPrefix": "Orden:",
  "toolbar.openFilters": "Abrir filtros",
  "toolbar.openFiltersActive": "Abrir filtros ({{count}} activos)",
  "toolbar.filters": "Filtros",
  "sort.sortBy": "Ordenar por",
  "sort.default": "Predeterminado",
  "sort.date": "Fecha",
  "sort.amount": "Importe",
  "sort.name": "Nombre",
  "sort.dateNewestFirst": "Fecha — más recientes primero",
  "sort.amountHighestFirst": "Importe — mayor primero",
  "sort.nameAToZ": "Nombre — A → Z",
  "sort.thenByDescription": "y luego por descripción",

  // Filters & sort sheet
  "filterSheet.heading": "Filtros y orden",
  "filterSheet.close": "Cerrar filtros",
  "filterSheet.search": "Buscar",
  "filterSheet.searchIn": "Buscar en",
  "filterSheet.scopeAll": "Todo el texto",
  "filterSheet.scopeDescription": "Solo descripción",
  "filterSheet.scopeHint":
    "«Todo el texto» busca en la categoría y la descripción. Cambia a «Solo descripción» para buscar únicamente en lo que escribiste en el movimiento.",
  "filterSheet.filterByCategory": "Filtrar por categoría",
  "filterSheet.all.incomes": "Todos los ingresos",
  "filterSheet.all.expenses": "Todos los gastos",
  "filterSheet.all.entries": "Todos los movimientos",
  "filterSheet.sameAsToolbar": "igual que en la barra",
  "filterSheet.clearAll": "Limpiar todo",
  "filterSheet.showResults_one": "Mostrar {{count}} resultado",
  "filterSheet.showResults_other": "Mostrar {{count}} resultados",
  "filters.categoryChip": "Categoría: {{category}}",

  // Filtered banner & empty state
  "filteredBanner.title": "Vista filtrada",
  "filteredBanner.count": "{{shown}} de {{total}} movimientos",
  "filteredBanner.clear": "Limpiar",
  "filteredBanner.removeFilter": "Quitar filtro {{label}}",
  "filteredBanner.total": "Total filtrado",
  "filterEmpty.title": "Ningún movimiento coincide con tus filtros",
  "filterEmpty.hint":
    "Prueba con otro término de búsqueda o una categoría más amplia.",
  "filterEmpty.clearAll": "Quitar todos los filtros",

  // Buckets
  "buckets.pageTitle": "Límites mensuales",
  "buckets.allocation": "Asignado en {{month}}: {{amount}}",
  "buckets.emptyTitle": "Todavía no hay límites",
  "buckets.emptyMessage":
    "Aún no has añadido ningún límite. Añade el primero para empezar a controlar tu gasto mensual.",
  "buckets.addNew": "Añadir límite",
  "bucket.edit": "Editar {{category}}",
  "bucket.spent": "Gastado: {{amount}}",
  "bucket.remaining": "Disponible: {{amount}}",
  "bucket.carryOver": "Asignación {{allowance}} + arrastrado {{carried}}",
  "bucketForm.monthlyAllowance": "Asignación mensual",
  "bucketForm.amountPlaceholder": "Introduce el importe del límite",
  "addBucket.pageTitle": "Límites",
  "addBucket.noCategories":
    "Todas las categorías ya tienen un límite. Primero <link>añade una categoría nueva</link>.",
  "addBucket.categoryHint":
    "Elige una de tus categorías para darle un límite de gasto mensual.",
  "addBucket.allowancePlaceholder": "Introduce la asignación del límite",
  "addBucket.createFailed": "No se pudo crear el límite",
  "editBucket.pageTitle": "Editar límite: {{name}}",
  "editBucket.hint":
    "Los cambios se aplican desde el mes que estás viendo en adelante; los meses anteriores conservan su límite.",

  // Categories
  "categories.pageTitle": "Categorías",
  "categories.subtitle":
    "Todas las categorías de gasto, con o sin límite",
  "categories.noBucket": "(sin límite)",
  "categories.addNew": "Añadir categoría",
  "addCategory.name": "Nombre",
  "addCategory.hint":
    "Las categorías agrupan tus gastos. Más adelante puedes darle a una categoría un límite de gasto.",
  "addCategory.namePlaceholder": "Nombre de la categoría",
  "addCategory.createFailed": "No se pudo crear la categoría",

  // Form validation
  "validation.categoryNameEmpty": "El nombre de la categoría no puede estar vacío",
  "validation.categoryExists": "Ya existe una categoría «{{name}}»",
  "validation.selectCategory": "Selecciona una categoría",
  "validation.bucketExists": "Ya existe un límite para «{{name}}»",
  "validation.allowanceInvalid": "La asignación debe ser un número válido",
  "validation.allowancePositive": "La asignación debe ser mayor que cero",

  // Fixed (recurring) entries
  "fixedEntries.pageTitle": "Movimientos fijos",
  "fixedEntries.subtitle":
    "Ingresos y gastos fijos que se aplican en {{month}}",
  "fixedEntries.empty":
    "Todavía no hay movimientos fijos para este mes. Añade uno desde Añadir ingreso o Añadir gasto y activa «Recurrente».",
  "fixedEntries.addIncome": "Añadir ingreso",
  "fixedEntries.addExpense": "Añadir gasto",

  // Data management
  "dataManagement.backupTitle": "Mantén tus datos a salvo",
  "dataManagement.backupDescription":
    "Todo lo que registras vive solo en este navegador. Descarga una copia de seguridad con regularidad para poder restaurarla aquí o en otro dispositivo.",
  "dataManagement.download": "Descargar copia de seguridad",
  "dataManagement.restore": "Restaurar copia de seguridad",
  "dataManagement.restoreFailed": "No se pudo restaurar la copia de seguridad",
  "dataManagement.dangerTitle": "Zona de peligro",
  "dataManagement.dangerDescription":
    "Elimina todos los movimientos, límites y categorías de este dispositivo. Esta acción no se puede deshacer.",
  "dataManagement.clearAll": "Borrar todos los datos",
  "dataManagement.clearConfirm":
    "Esto elimina para siempre todos los movimientos, límites y categorías guardados en este dispositivo. ¿Seguro que quieres continuar?",
  "backup.notJson":
    "Este archivo no es una copia de seguridad válida: no se pudo leer como JSON",
  "backup.invalid": "Este archivo no es una copia de seguridad válida",
  "backup.otherApp":
    "Este archivo no es una copia de seguridad válida de esta aplicación",
  "backup.unsupportedVersion":
    "Versión de copia de seguridad no compatible: {{version}}",

  // Sync card (Data Management)
  "syncCard.title": "Sincroniza con tu grupo",
  "syncCard.description":
    "Trae lo que añadió tu familia, revísalo y luego incorpóralo.",
  "syncCard.syncButton": "Sincronizar con el grupo",
  "syncCard.syncing": "Sincronizando…",
  "syncCard.syncingStatus": "Sincronizando con tu grupo…",
  "syncCard.upToDate": "Todo está al día.",
  "syncCard.firstSync":
    "Es la primera sincronización de tu grupo. Tus datos son ahora el punto de partida: las próximas sincronizaciones se compararán con ellos.",
  "syncCard.connectionFailed":
    "No se pudo contactar con tu grupo. Comprueba tu conexión e inténtalo de nuevo.",
  "syncCard.unsupportedSchemaVersion":
    "La versión de la aplicación en este dispositivo es demasiado antigua para leer los datos de tu grupo. Actualiza la aplicación y vuelve a sincronizar.",
  "syncCard.declinedBlocked":
    "Se rechazó la sincronización: el organizador te ha expulsado del grupo. No se cambió nada en este dispositivo.",
  "syncCard.declinedCanceled":
    "Se rechazó la sincronización: tu grupo fue cancelado. No se cambió nada en este dispositivo.",
  "syncCard.conflict":
    "Tu grupo sincronizó cambios nuevos mientras sincronizabas. Vuelve a sincronizar para incorporarlos.",
  "syncCard.captionSignedOut":
    "Inicia sesión y únete a un grupo para sincronizar tus movimientos entre dispositivos.",
  "syncCard.captionCheckFailed":
    "No se pudo comprobar tu grupo. Se volverá a intentar cuando abras de nuevo esta pantalla.",
  "syncCard.captionChecking": "Comprobando tu grupo…",
  "syncCard.captionNoParty": "Crea un grupo o únete a uno para empezar a sincronizar.",
  "syncCard.captionBlocked":
    "El organizador te ha expulsado del grupo. La sincronización no está disponible.",
  "syncCard.captionCanceled":
    "Tu grupo fue cancelado. Crea uno nuevo o únete a otro para volver a sincronizar.",
  "syncCard.neverSynced": "Aún no se ha sincronizado",
  "syncCard.lastSynced": "Última sincronización: {{when}}",

  // Sync server errors, by code
  "syncError.VALIDATION_ERROR":
    "Algunos de los datos que introdujiste no son válidos. Revísalos e inténtalo de nuevo.",
  "syncError.EMAIL_TAKEN": "Ya existe una cuenta con este correo electrónico.",
  "syncError.INVALID_CREDENTIALS": "El correo o la contraseña no son correctos.",
  "syncError.UNAUTHORIZED": "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  "syncError.ALREADY_IN_PARTY": "Ya perteneces a un grupo.",
  "syncError.NOT_ORGANIZER": "Solo el organizador del grupo puede hacer eso.",
  "syncError.NO_PARTY": "Todavía no perteneces a ningún grupo.",
  "syncError.PARTY_CANCELED": "Este grupo fue cancelado.",
  "syncError.INVITATION_NOT_FOUND": "Ese código de invitación no existe.",
  "syncError.INVITATION_WRONG_PASSWORD":
    "Esa contraseña no corresponde a esta invitación.",
  "syncError.INVITATION_USED": "Esta invitación ya se ha utilizado.",
  "syncError.BLOCKED": "El organizador te ha expulsado de este grupo.",
  "syncError.NO_BACKUP": "Tu grupo todavía no ha sincronizado ningún dato.",
  "syncError.VERSION_CONFLICT":
    "Tu grupo sincronizó cambios nuevos mientras tanto. Vuelve a sincronizar.",
  "syncError.CONFLICT":
    "Otra persona cambió esto al mismo tiempo. Inténtalo de nuevo.",
  "syncError.PAYLOAD_TOO_LARGE":
    "Hay demasiados datos para sincronizar de una sola vez.",
  "syncError.NETWORK_ERROR":
    "No se pudo contactar con el servidor de sincronización. Inténtalo de nuevo.",
  "syncError.UNSUPPORTED_SCHEMA_VERSION":
    "Esta versión de la aplicación no puede leer la copia de seguridad del grupo.",

  // Account & auth
  "account.pageTitle": "Cuenta",
  "account.logOut": "Cerrar sesión",
  "account.signedOut": "Sesión cerrada. Tus datos se quedan en este dispositivo.",
  "account.description":
    "Inicia sesión para sincronizar tus movimientos entre dispositivos con tu grupo.",
  "account.signIn": "Iniciar sesión",
  "account.signUp": "Registrarse",
  "account.reassurance":
    "Todo sigue funcionando sin una cuenta: solo hace falta para sincronizar con un grupo.",
  "auth.firstName": "Nombre",
  "auth.lastName": "Apellido",
  "auth.email": "Correo electrónico",
  "auth.password": "Contraseña",
  "auth.retypePassword": "Repite la contraseña",
  "auth.firstNameRequired": "El nombre es obligatorio",
  "auth.lastNameRequired": "El apellido es obligatorio",
  "auth.emailRequired": "El correo electrónico es obligatorio",
  "auth.passwordRequired": "La contraseña es obligatoria",
  "auth.passwordsMustMatch": "Las contraseñas deben coincidir",
  "signIn.submitting": "Iniciando sesión…",
  "signIn.invalidCredentials": "El correo o la contraseña no son correctos.",
  "signIn.failed": "No se pudo iniciar sesión. Inténtalo de nuevo.",
  "signUp.submitting": "Registrando…",
  "signUp.emailTaken":
    "Ya existe una cuenta con este correo electrónico. Prueba a iniciar sesión.",
  "signUp.failed": "No se pudo completar el registro. Inténtalo de nuevo.",

  // Party
  "party.pageTitle": "Grupo",
  "party.signInPrompt": "Inicia sesión para crear un grupo o unirte a uno.",
  "party.goToAccount": "Ir a Cuenta",
  "party.loading": "Cargando tu grupo…",
  "party.blockedStatus": "El organizador te ha expulsado de este grupo.",
  "party.create": "Crear un grupo",
  "party.createDescription":
    "Crea un grupo para sincronizar movimientos con tu familia.",
  "party.createConfirm":
    "¿Crear un grupo? Serás su organizador y podrás invitar a tu familia.",
  "party.createFailed": "No se pudo crear el grupo.",
  "party.join": "Unirse a un grupo",
  "party.joinDescription":
    "¿Tienes un código de invitación? Únete al grupo que te invitó.",
  "party.organizer": "Organizador",
  "party.inviteHint": "Invita a tu familia para empezar a sincronizar.",
  "party.addMember": "Añadir un miembro",
  "party.cancel": "Cancelar el grupo",
  "party.onlyOrganizerCanManage":
    "Solo {{name}}, el organizador, puede añadir o quitar miembros.",
  "party.onlyTheOrganizerCanManage":
    "Solo el organizador puede añadir o quitar miembros.",
  "party.blockConfirm":
    "¿Bloquear a {{firstName}} {{lastName}}? Esta acción no se puede deshacer. Perderá de inmediato la posibilidad de sincronizar, y los movimientos que ya aportó se quedan en el historial del grupo.",
  "party.blockFailed": "No se pudo bloquear al miembro.",
  "party.cancelConfirm":
    "¿Cancelar {{name}}? Esta acción no se puede deshacer. Ningún miembro podrá sincronizar después, y no se borran los datos locales de nadie.",
  "party.cancelFailed": "No se pudo cancelar el grupo.",
  "memberRow.you": "(tú)",
  "memberRow.blocked": "Bloqueado",
  "memberRow.block": "Bloquear",
  "memberRow.blockLabel": "Bloquear a {{firstName}} {{lastName}}",
  "shareField.show": "Mostrar {{label}}",
  "shareField.hide": "Ocultar {{label}}",
  "shareField.copy": "Copiar {{label}}",
  "shareField.copied": "Copiado",
  "invite.setPassword": "Define una contraseña de invitación",
  "invite.setPasswordDescription":
    "La persona que invites necesitará esta contraseña junto con el código de invitación.",
  "invite.passwordPlaceholder": "Contraseña de invitación",
  "invite.generating": "Generando…",
  "invite.generate": "Generar invitación",
  "invite.createFailed": "No se pudo crear la invitación.",
  "invite.ready": "Invitación lista",
  "invite.code": "Código",
  "invite.shareHint": "Comparte el código y la contraseña por canales distintos.",
  "invite.done": "Listo",
  "join.description":
    "Introduce el código de invitación y la contraseña que te compartió el organizador.",
  "join.codePlaceholder": "Código de invitación",
  "join.joining": "Uniéndote…",
  "join.submit": "Unirme",
  "join.failed": "No se pudo unir al grupo. Inténtalo de nuevo.",
  "join.wrongPassword":
    "Esa contraseña no corresponde a esta invitación. Compruébala con quien te invitó e inténtalo de nuevo.",
  "join.invitationUsed":
    "Esta invitación ya se ha utilizado. Pide al organizador que te envíe una nueva.",
  "join.alreadyInParty": "Ya perteneces a un grupo. Actualiza para verlo.",
  "join.invitationNotFound":
    "Ese código de invitación no existe. Compruébalo con quien te invitó.",

  // Sync review wizard
  "syncReview.pageTitle": "Revisar cambios",
  "syncReview.leaveConfirm":
    "¿Dejar de revisar? No se guardará ninguna de tus decisiones de esta sesión. Puedes volver a sincronizar cuando quieras.",
  "syncReview.success": "¡Sincronizado! Tu grupo está al día.",
  "syncReview.nothingToReview":
    "No hay nada que revisar ahora mismo. Sincroniza con tu grupo desde Gestión de datos para buscar cambios.",
  "syncReview.goToDataManagement": "Ir a Gestión de datos",
  "syncReview.progress": "Elemento {{current}} de {{total}}",
  "syncReview.acceptAll": "Aceptar todo",
  "syncReview.rejectAll": "Rechazar todo",
  "syncReview.complete": "Revisión completada",
  "syncReview.counts":
    "{{accepted}} aceptados · {{modified}} modificados · {{rejected}} rechazados",
  "syncReview.saving": "Guardando tus cambios…",
  "syncReview.savingShort": "Guardando…",
  "syncReview.uploadFailed":
    "No se pudieron guardar tus cambios en el grupo. Comprueba tu conexión e inténtalo de nuevo.",
  "syncReview.uploadConflict":
    "Tu grupo sincronizó cambios nuevos mientras revisabas. Vuelve a sincronizar para incorporarlos: revisarás todo de nuevo, incluido lo que acabas de ver.",
  "syncReview.syncAgain": "Volver a sincronizar",
  "syncReview.retry": "Reintentar",
  "syncReview.uploadAndFinish": "Subir y terminar",
  "syncReview.cancelReview": "Cancelar revisión",
  "syncReview.kind.income": "Ingreso",
  "syncReview.kind.expense": "Gasto",
  "syncReview.kind.fixedIncome": "Ingreso fijo",
  "syncReview.kind.fixedExpense": "Gasto fijo",
  "syncReview.kind.bucket": "Límite",
  "syncReview.addedBy": "Añadido por {{name}}",
  "syncReview.addedAnonymously": "Añadido de forma anónima",
  "syncReview.from": "Desde {{month}}",
  "syncReview.removedFrom": "Eliminado desde {{month}}",
  "syncReview.fromTheBeginning": "Desde el principio",
  "syncReview.monthlyAllowance": "{{amount}} de asignación mensual",
  "syncReview.shortLabel": "{{kind}} de {{amount}} {{attribution}}",
  "syncReview.removalShortLabel": "eliminación de {{kind}} {{attribution}}",
  "syncReview.bucketShortLabel": "límite {{name}} {{attribution}}",
  "syncReview.fullHistory":
    "Es nuevo: tu decisión abarca todo su historial ({{count}} cambios).",
  "syncReview.accept": "Aceptar",
  "syncReview.acceptLabel": "Aceptar {{label}}",
  "syncReview.modify": "Modificar",
  "syncReview.modifyLabel": "Modificar {{label}}",
  "syncReview.reject": "Rechazar",
  "syncReview.rejectLabel": "Rechazar {{label}}",
  "syncReview.date": "Fecha",
  "syncReview.enterNumber": "Introduce un número.",
  "syncReview.enterDate": "Introduce una fecha.",
  "syncReview.saveAndAccept": "Guardar y aceptar",
};

export default es;
