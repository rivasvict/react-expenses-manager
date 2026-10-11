import { Translations } from "./en";

/**
 * French UI text. Typed as `Translations`, so a key missing from (or extra
 * to) ./en.ts fails the type check. See ./en.ts for the conventions.
 *
 * Glossary, kept consistent across screens: entry → opération, income →
 * revenu, expense → dépense, bucket → plafond (a bucket *is* a monthly
 * spending limit), allowance → montant alloué, fixed entry → opération fixe,
 * party → groupe, organizer → organisateur, sync → synchroniser,
 * backup → sauvegarde.
 *
 * Keep `nav.*` labels short (about ten characters): on phones the five tabs
 * share the width of the screen.
 */
const fr: Translations = {
  // Shared words
  "common.cancel": "Annuler",
  "common.expenses": "Dépenses",
  "common.goBack": "Retour",
  "common.incomes": "Revenus",
  "common.savings": "Épargne",
  "common.submit": "Enregistrer",
  "common.summary": "Résumé",

  // Language names, in the current UI language (Settings screen)
  "language.en": "Anglais",
  "language.es": "Espagnol",
  "language.fr": "Français",

  // Relative times and dates (dayjs format tokens for `time.dateFormat`)
  "time.justNow": "à l'instant",
  "time.minutesAgo_one": "il y a 1 minute",
  "time.minutesAgo_other": "il y a {{count}} minutes",
  "time.hoursAgo_one": "il y a 1 heure",
  "time.hoursAgo_other": "il y a {{count}} heures",
  "time.daysAgo_one": "il y a 1 jour",
  "time.daysAgo_other": "il y a {{count}} jours",
  "time.dateFormat": "D MMM YYYY",

  // App bar
  "header.appName": "Suivi des dépenses",
  "header.logoTitle": "Logo de Suivi des dépenses",
  "nav.ariaLabel": "Navigation principale",
  "nav.home": "Accueil",
  "nav.categories": "Catégories",
  "nav.buckets": "Plafonds",
  "nav.fixedEntries": "Fixes",
  "nav.data": "Données",
  "nav.dataManagement": "Gestion des données",
  "accountChip.loggedOut": "Compte",
  "accountChip.loggedIn": "Compte : {{firstName}} {{lastName}}",
  "syncStatus.unknown": "Serveur de synchronisation : vérification…",
  "syncStatus.online": "Serveur de synchronisation : en ligne",
  "syncStatus.offline": "Serveur de synchronisation : hors ligne",

  // Settings
  "settings.title": "Réglages",
  "settings.language.title": "Langue",
  "settings.language.description":
    "Choisissez la langue de l'application. Votre choix est enregistré sur cet appareil et s'applique immédiatement.",

  "version.label": "Version {{version}}",

  // First-run data disclaimer
  "dataDisclaimer.title": "Vos données restent sur cet appareil",
  "dataDisclaimer.body":
    "Cette application sert à valider le produit. Rien de ce que vous saisissez n'est stocké ailleurs que sur cet appareil, et vos données sont conservées tant que les données du navigateur ne sont pas effacées. Vous pouvez télécharger une sauvegarde à tout moment depuis Gestion des données.",
  "dataDisclaimer.dontShowAgain": "Ne plus afficher ce message",
  "dataDisclaimer.confirm": "Compris",

  // Month stepper
  "monthHeader.previous": "Mois précédent",
  "monthHeader.next": "Mois suivant",

  // Dashboard
  "dashboard.pageTitle": "Bilan mensuel",
  "dashboard.addIncome": "Ajouter un revenu",
  "dashboard.addExpenses": "Ajouter une dépense",

  // Savings change badge (dashboard balance hero)
  "savingsChange.vs": "vs {{month}}",
  "savingsChange.label.up": "Épargne en hausse de {{percent}} par rapport à {{month}}",
  "savingsChange.label.down":
    "Épargne en baisse de {{percent}} par rapport à {{month}}",
  "savingsChange.label.flat": "Épargne stable par rapport à {{month}}",
  "savingsChange.nothingToCompare": "Rien à comparer avec {{month}}",

  // Savings trend screen (/savings-trend) and the dashboard link to it
  "savingsTrend.pageTitle": "Évolution de l'épargne",
  "savingsTrend.link": "Évolution",
  "savingsTrend.linkLabel": "Évolution de l'épargne",
  "savingsTrend.rangeGroup": "Période",
  "savingsTrend.range.1M": "1M",
  "savingsTrend.range.2M": "2M",
  "savingsTrend.range.3M": "3M",
  "savingsTrend.range.6M": "6M",
  "savingsTrend.range.1Y": "1A",
  "savingsTrend.range.YTD": "YTD",
  "savingsTrend.rangeLabel.months_one": "Le mois dernier",
  "savingsTrend.rangeLabel.months_other": "Les {{count}} derniers mois",
  "savingsTrend.rangeLabel.ytd": "Depuis le début de l'année",
  "savingsTrend.customRange": "Période personnalisée",
  "savingsTrend.compare": "{{end}} vs {{reference}}",
  "savingsTrend.note":
    "Chaque point représente l'épargne d'un mois. En vert quand elle dépasse {{reference}}, en rouge quand elle est inférieure.",
  "savingsTrend.key.reference": "Épargne en {{reference}}",
  "savingsTrend.key.above": "Au-dessus",
  "savingsTrend.key.below": "En dessous",
  "savingsTrend.chartLabel":
    "Épargne mensuelle de {{from}} à {{to}}, terminant à {{value}}",
  "savingsTrend.table.caption": "Épargne mensuelle",
  "savingsTrend.table.month": "Mois",
  "savingsTrend.table.savings": "Épargne",
  "savingsTrend.tooltipVs": "{{difference}} vs {{month}}",
  "savingsTrend.empty.title": "Pas encore assez d'historique",
  "savingsTrend.empty.body":
    "Une évolution nécessite au moins deux mois. Continuez à saisir vos revenus et vos dépenses, ou choisissez un mois plus récent.",
  "savingsTrend.short.title": "Pas assez d'historique pour cette période",
  "savingsTrend.short.body":
    "Vos données commencent en {{month}}. Comparez plutôt avec ce mois, ou choisissez une période plus courte.",
  "savingsTrend.short.action": "Comparer avec {{month}}",
  "savingsTrend.sheet.title": "Période personnalisée",
  "savingsTrend.sheet.hint":
    "Comparez un mois avec n'importe quel mois antérieur. Mois entiers uniquement.",
  "savingsTrend.sheet.from": "Du",
  "savingsTrend.sheet.to": "Au",
  "savingsTrend.sheet.show": "Afficher l'évolution",
  "savingsTrend.sheet.close": "Fermer",

  // Add / edit entry form
  "entryForm.pageTitle.income": "Revenu",
  "entryForm.pageTitle.expense": "Dépense",
  "entryForm.heading.add.income": "Nouveau revenu",
  "entryForm.heading.add.expense": "Nouvelle dépense",
  "entryForm.heading.edit.income": "Modifier le revenu",
  "entryForm.heading.edit.expense": "Modifier la dépense",
  "entryForm.amount": "Montant",
  "entryForm.amountPlaceholder.income": "Saisissez le montant du revenu",
  "entryForm.amountPlaceholder.expense": "Saisissez le montant de la dépense",
  "entryForm.description": "Description",
  "entryForm.optional": "(facultatif)",
  "entryForm.category": "Catégorie",
  "entryForm.selectCategory": "Choisissez une catégorie",
  "entryForm.recurring": "Récurrent (s'applique chaque mois)",
  "entryForm.remove": "Supprimer l'opération",
  "entryForm.notFound": "Opération introuvable",

  // Calculator keypad on amount fields
  "calculator.keypad": "Pavé de calculatrice",
  "calculator.calculation": "Calcul",
  "calculator.plus": "Plus",
  "calculator.minus": "Moins",
  "calculator.multiply": "Multiplier",
  "calculator.divide": "Diviser",
  "calculator.equals": "Égal",
  "calculator.decimalPoint": "Séparateur décimal",
  "calculator.clear": "Effacer",
  "calculator.backspace": "Supprimer le dernier caractère",
  "calculator.divisionByZero": "Division par zéro impossible",

  // Searchable category dropdown
  "categorySelect.searchPlaceholder": "Rechercher une catégorie…",
  "categorySelect.searchLabel": "Rechercher une catégorie",
  "categorySelect.noMatches": "Aucune catégorie correspondante",

  // Entry lists
  "entriesSummary.empty": "Rien pour ce mois pour l'instant.",
  "entriesSummary.addedOn": "Ajouté le {{date}}",
  "entries.count_one": "{{count}} opération",
  "entries.count_other": "{{count}} opérations",
  "entriesReport.pageTitle": "Rapport mensuel",
  "entriesReport.total.incomes": "Total des revenus",
  "entriesReport.total.expenses": "Total des dépenses",
  "entriesReport.matching.incomes": "Revenus correspondants",
  "entriesReport.matching.expenses": "Dépenses correspondantes",

  // Monthly summary
  "summary.pageTitle": "Résumé mensuel",
  "summary.monthTotal": "Total de {{month}}",
  "summary.show": "Afficher",
  "summary.showAll": "Tous les revenus et dépenses",
  "summary.filteredTitle": "Vue filtrée · les deux listes",
  "summary.filteredTotal": "Total filtré · net",

  // Filter & sort toolbar
  "toolbar.searchEntries": "Rechercher des opérations",
  "toolbar.searchPlaceholder": "Rechercher",
  "toolbar.sortEntries": "Trier les opérations",
  "toolbar.sortPrefix": "Tri :",
  "toolbar.openFilters": "Ouvrir les filtres",
  "toolbar.openFiltersActive": "Ouvrir les filtres ({{count}} actifs)",
  "toolbar.filters": "Filtres",
  "sort.sortBy": "Trier par",
  "sort.default": "Par défaut",
  "sort.date": "Date",
  "sort.amount": "Montant",
  "sort.name": "Nom",
  "sort.dateNewestFirst": "Date — plus récentes d'abord",
  "sort.amountHighestFirst": "Montant — plus élevés d'abord",
  "sort.nameAToZ": "Nom — A → Z",
  "sort.thenByDescription": "puis par description",

  // Filters & sort sheet
  "filterSheet.heading": "Filtres et tri",
  "filterSheet.close": "Fermer les filtres",
  "filterSheet.search": "Recherche",
  "filterSheet.searchIn": "Rechercher dans",
  "filterSheet.scopeAll": "Tout le texte",
  "filterSheet.scopeDescription": "Description seulement",
  "filterSheet.scopeHint":
    "« Tout le texte » cherche dans la catégorie et la description. Choisissez « Description seulement » pour limiter la recherche à ce que vous avez saisi sur l'opération.",
  "filterSheet.filterByCategory": "Filtrer par catégorie",
  "filterSheet.all.incomes": "Tous les revenus",
  "filterSheet.all.expenses": "Toutes les dépenses",
  "filterSheet.all.entries": "Toutes les opérations",
  "filterSheet.sameAsToolbar": "comme dans la barre d'outils",
  "filterSheet.clearAll": "Tout effacer",
  "filterSheet.showResults_one": "Afficher {{count}} résultat",
  "filterSheet.showResults_other": "Afficher {{count}} résultats",
  "filters.categoryChip": "Catégorie : {{category}}",

  // Filtered banner & empty state
  "filteredBanner.title": "Vue filtrée",
  "filteredBanner.count": "{{shown}} sur {{total}} opérations",
  "filteredBanner.clear": "Effacer",
  "filteredBanner.removeFilter": "Retirer le filtre {{label}}",
  "filteredBanner.total": "Total filtré",
  "filterEmpty.title": "Aucune opération ne correspond à vos filtres",
  "filterEmpty.hint":
    "Essayez un autre terme de recherche ou une catégorie plus large.",
  "filterEmpty.clearAll": "Effacer tous les filtres",

  // Buckets
  "buckets.pageTitle": "Plafonds mensuels",
  "buckets.allocation": "Alloué en {{month}} : {{amount}}",
  "buckets.emptyTitle": "Aucun plafond pour l'instant",
  "buckets.emptyMessage":
    "Vous n'avez ajouté aucun plafond. Ajoutez votre premier plafond pour suivre vos limites de dépenses mensuelles.",
  "buckets.addNew": "Ajouter un plafond",
  "bucket.edit": "Modifier {{category}}",
  "bucket.spent": "Dépensé : {{amount}}",
  "bucket.remaining": "Restant : {{amount}}",
  "bucket.carryOver": "Montant alloué {{allowance}} + report {{carried}}",
  "bucketForm.monthlyAllowance": "Montant alloué mensuel",
  "bucketForm.amountPlaceholder": "Saisissez le montant du plafond",
  "addBucket.pageTitle": "Plafonds",
  "addBucket.noCategories":
    "Chaque catégorie a déjà un plafond. <link>Ajoutez d'abord une nouvelle catégorie</link>.",
  "addBucket.categoryHint":
    "Choisissez une de vos catégories pour lui attribuer une limite de dépenses mensuelle.",
  "addBucket.allowancePlaceholder": "Saisissez le montant alloué",
  "addBucket.createFailed": "Le plafond n'a pas pu être créé",
  "editBucket.pageTitle": "Modifier le plafond : {{name}}",
  "editBucket.hint":
    "Les modifications s'appliquent à partir du mois affiché ; les mois précédents conservent leur ancienne limite.",

  // Categories
  "categories.pageTitle": "Catégories",
  "categories.subtitle": "Toutes les catégories de dépenses, avec ou sans plafond",
  "categories.noBucket": "(sans plafond)",
  "categories.addNew": "Ajouter une catégorie",
  "addCategory.name": "Nom",
  "addCategory.hint":
    "Les catégories regroupent vos dépenses. Vous pourrez ajouter plus tard une limite de dépenses (plafond) à une catégorie.",
  "addCategory.namePlaceholder": "Nom de la catégorie",
  "addCategory.createFailed": "La catégorie n'a pas pu être créée",

  // Form validation
  "validation.categoryNameEmpty": "Le nom de la catégorie ne peut pas être vide",
  "validation.categoryExists": "Une catégorie « {{name}} » existe déjà",
  "validation.selectCategory": "Veuillez choisir une catégorie",
  "validation.bucketExists": "Un plafond pour « {{name}} » existe déjà",
  "validation.allowanceInvalid": "Le montant alloué doit être un nombre valide",
  "validation.allowancePositive": "Le montant alloué doit être supérieur à zéro",

  // Fixed (recurring) entries
  "fixedEntries.pageTitle": "Opérations fixes",
  "fixedEntries.subtitle":
    "Revenus et dépenses récurrents qui s'appliquent à {{month}}",
  "fixedEntries.empty":
    "Aucune opération récurrente ne s'applique encore à ce mois. Ajoutez-en une depuis Ajouter un revenu ou Ajouter une dépense en activant « Récurrent ».",
  "fixedEntries.addIncome": "Ajouter un revenu",
  "fixedEntries.addExpense": "Ajouter une dépense",

  // Data management
  "dataManagement.backupTitle": "Protégez vos données",
  "dataManagement.backupDescription":
    "Tout ce que vous suivez n'existe que dans ce navigateur. Téléchargez régulièrement une sauvegarde pour pouvoir la restaurer ici ou sur un autre appareil.",
  "dataManagement.download": "Télécharger une sauvegarde",
  "dataManagement.restore": "Restaurer une sauvegarde",
  "dataManagement.restoreFailed": "La sauvegarde n'a pas pu être restaurée",
  "dataManagement.dangerTitle": "Zone dangereuse",
  "dataManagement.dangerDescription":
    "Supprime toutes les opérations, tous les plafonds et toutes les catégories de cet appareil. Cette action est irréversible.",
  "dataManagement.clearAll": "Effacer toutes les données",
  "dataManagement.clearConfirm":
    "Cela supprime définitivement toutes les opérations, tous les plafonds et toutes les catégories enregistrés sur cet appareil. Voulez-vous continuer ?",
  "backup.notJson":
    "Ce fichier n'est pas une sauvegarde valide : il n'a pas pu être lu comme du JSON",
  "backup.invalid": "Ce fichier n'est pas une sauvegarde valide",
  "backup.otherApp":
    "Ce fichier n'est pas une sauvegarde valide pour cette application",
  "backup.unsupportedVersion":
    "Version de sauvegarde non prise en charge : {{version}}",

  // Sync card (Data Management)
  "syncCard.title": "Synchroniser avec votre groupe",
  "syncCard.description":
    "Récupérez ce que votre famille a ajouté, vérifiez-le, puis intégrez-le.",
  "syncCard.syncButton": "Synchroniser avec le groupe",
  "syncCard.syncing": "Synchronisation…",
  "syncCard.syncingStatus": "Synchronisation avec votre groupe…",
  "syncCard.upToDate": "Tout est à jour.",
  "syncCard.firstSync":
    "C'est la première synchronisation de votre groupe. Vos données servent désormais de point de départ ; les prochaines synchronisations seront comparées avec elles.",
  "syncCard.connectionFailed":
    "Impossible de joindre votre groupe. Vérifiez votre connexion et réessayez.",
  "syncCard.unsupportedSchemaVersion":
    "La version de l'application sur cet appareil est trop ancienne pour lire les données de votre groupe. Mettez l'application à jour et synchronisez à nouveau.",
  "syncCard.declinedBlocked":
    "Cette synchronisation a été refusée : l'organisateur vous a retiré de votre groupe. Rien n'a été modifié sur cet appareil.",
  "syncCard.declinedCanceled":
    "Cette synchronisation a été refusée : votre groupe a été dissous. Rien n'a été modifié sur cet appareil.",
  "syncCard.conflict":
    "Votre groupe a synchronisé de nouvelles modifications pendant votre synchronisation. Synchronisez à nouveau pour les récupérer.",
  "syncCard.captionSignedOut":
    "Connectez-vous et rejoignez un groupe pour synchroniser vos opérations entre vos appareils.",
  "syncCard.captionCheckFailed":
    "Impossible de vérifier votre groupe. Une nouvelle tentative aura lieu à la prochaine ouverture de cet écran.",
  "syncCard.captionChecking": "Vérification de votre groupe…",
  "syncCard.captionNoParty":
    "Créez ou rejoignez un groupe pour commencer à synchroniser.",
  "syncCard.captionBlocked":
    "L'organisateur vous a retiré de votre groupe. La synchronisation n'est pas disponible.",
  "syncCard.captionCanceled":
    "Votre groupe a été dissous. Créez-en ou rejoignez-en un nouveau pour synchroniser à nouveau.",
  "syncCard.neverSynced": "Jamais synchronisé",
  "syncCard.lastSynced": "Dernière synchronisation : {{when}}",

  // Sync server unavailable (offline or not set up)
  "syncOffline.status": "Le serveur de synchronisation est hors ligne",
  "syncOffline.dataManagementNote":
    "La synchronisation reviendra d'elle-même dès que le serveur répondra. Vos opérations sont en sécurité sur cet appareil.",
  "syncOffline.accountSignedInNote":
    "Votre groupe et la synchronisation sont masqués jusqu'à ce qu'il réponde à nouveau. Vous restez connecté.",
  "syncOffline.accountSignedOutNote":
    "La connexion et l'inscription nécessitent le serveur de synchronisation. Revenez ici dès qu'il répondra.",
  "syncUnavailable.title": "La synchronisation n'est pas disponible pour le moment",
  "syncUnavailable.message":
    "Cette page nécessite le serveur de synchronisation, qui ne répond pas. Tout le reste fonctionne normalement sur cet appareil.",
  "syncUnavailable.goToDashboard": "Aller au tableau de bord",

  // Sync server errors, by code
  "syncError.VALIDATION_ERROR":
    "Certaines informations saisies ne sont pas valides. Vérifiez-les et réessayez.",
  "syncError.EMAIL_TAKEN": "Un compte existe déjà avec cette adresse e-mail.",
  "syncError.INVALID_CREDENTIALS": "E-mail ou mot de passe incorrect.",
  "syncError.UNAUTHORIZED": "Votre session a expiré. Reconnectez-vous.",
  "syncError.ALREADY_IN_PARTY": "Vous faites déjà partie d'un groupe.",
  "syncError.NOT_ORGANIZER": "Seul l'organisateur du groupe peut faire cela.",
  "syncError.NO_PARTY": "Vous ne faites encore partie d'aucun groupe.",
  "syncError.PARTY_CANCELED": "Ce groupe a été dissous.",
  "syncError.INVITATION_NOT_FOUND": "Ce code d'invitation n'existe pas.",
  "syncError.INVITATION_WRONG_PASSWORD":
    "Ce mot de passe ne correspond pas à cette invitation.",
  "syncError.INVITATION_USED": "Cette invitation a déjà été utilisée.",
  "syncError.BLOCKED": "L'organisateur vous a retiré de ce groupe.",
  "syncError.NO_BACKUP": "Votre groupe n'a encore synchronisé aucune donnée.",
  "syncError.VERSION_CONFLICT":
    "Votre groupe a synchronisé de nouvelles modifications entre-temps. Synchronisez à nouveau.",
  "syncError.CONFLICT":
    "Quelqu'un d'autre a modifié cet élément en même temps. Veuillez réessayer.",
  "syncError.PAYLOAD_TOO_LARGE":
    "Il y a trop de données à synchroniser en une seule fois.",
  "syncError.NETWORK_ERROR":
    "Impossible de joindre le serveur de synchronisation. Veuillez réessayer.",
  "syncError.UNSUPPORTED_SCHEMA_VERSION":
    "La sauvegarde de ce groupe n'a pas pu être lue par cette version de l'application.",

  // Account & auth
  "account.pageTitle": "Compte",
  "account.logOut": "Se déconnecter",
  "account.signedOut": "Déconnecté. Vos données restent sur cet appareil.",
  "account.description":
    "Connectez-vous pour synchroniser vos opérations entre vos appareils avec votre groupe.",
  "account.signIn": "Se connecter",
  "account.signUp": "S'inscrire",
  "account.reassurance":
    "Tout fonctionne sans compte : il n'est nécessaire que pour synchroniser avec un groupe.",
  "auth.firstName": "Prénom",
  "auth.lastName": "Nom",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.retypePassword": "Confirmez le mot de passe",
  "auth.firstNameRequired": "Le prénom est obligatoire",
  "auth.lastNameRequired": "Le nom est obligatoire",
  "auth.emailRequired": "L'e-mail est obligatoire",
  "auth.passwordRequired": "Le mot de passe est obligatoire",
  "auth.passwordsMustMatch": "Les mots de passe doivent être identiques",
  "signIn.submitting": "Connexion…",
  "signIn.invalidCredentials": "E-mail ou mot de passe incorrect.",
  "signIn.failed": "Impossible de se connecter. Veuillez réessayer.",
  "signUp.submitting": "Inscription…",
  "signUp.emailTaken":
    "Un compte existe déjà avec cette adresse e-mail. Essayez plutôt de vous connecter.",
  "signUp.failed": "Impossible de s'inscrire. Veuillez réessayer.",

  // Party
  "party.pageTitle": "Groupe",
  "party.signInPrompt": "Connectez-vous pour créer ou rejoindre un groupe.",
  "party.goToAccount": "Aller au compte",
  "party.loading": "Chargement de votre groupe…",
  "party.blockedStatus": "L'organisateur vous a retiré de ce groupe.",
  "party.create": "Créer un groupe",
  "party.createDescription":
    "Créez un groupe pour synchroniser vos opérations avec les membres de votre famille.",
  "party.createConfirm":
    "Créer un groupe ? Vous en serez l'organisateur et pourrez inviter des membres de votre famille.",
  "party.createFailed": "Impossible de créer le groupe.",
  "party.join": "Rejoindre un groupe",
  "party.joinDescription":
    "Vous avez un code d'invitation ? Rejoignez le groupe qui vous a invité.",
  "party.organizer": "Organisateur",
  "party.inviteHint":
    "Invitez des membres de votre famille pour commencer à synchroniser.",
  "party.addMember": "Ajouter un membre",
  "party.cancel": "Dissoudre le groupe",
  "party.onlyOrganizerCanManage":
    "Seul {{name}}, l'organisateur, peut ajouter ou retirer des membres.",
  "party.onlyTheOrganizerCanManage":
    "Seul l'organisateur peut ajouter ou retirer des membres.",
  "party.blockConfirm":
    "Bloquer {{firstName}} {{lastName}} ? Cette action est irréversible. Cette personne ne pourra plus synchroniser immédiatement, et les opérations qu'elle a déjà ajoutées restent dans l'historique du groupe.",
  "party.blockFailed": "Impossible de bloquer le membre.",
  "party.cancelConfirm":
    "Dissoudre {{name}} ? Cette action est irréversible. Plus aucun membre ne pourra synchroniser, et les données locales de chacun ne sont pas supprimées.",
  "party.cancelFailed": "Impossible de dissoudre le groupe.",
  "memberRow.you": "(vous)",
  "memberRow.blocked": "Bloqué",
  "memberRow.block": "Bloquer",
  "memberRow.blockLabel": "Bloquer {{firstName}} {{lastName}}",
  "shareField.show": "Afficher {{label}}",
  "shareField.hide": "Masquer {{label}}",
  "shareField.copy": "Copier {{label}}",
  "shareField.copied": "Copié",
  "invite.setPassword": "Définir un mot de passe d'invitation",
  "invite.setPasswordDescription":
    "La personne invitée aura besoin de ce mot de passe en plus du code d'invitation.",
  "invite.passwordPlaceholder": "Mot de passe d'invitation",
  "invite.generating": "Génération…",
  "invite.generate": "Générer une invitation",
  "invite.createFailed": "Impossible de créer l'invitation.",
  "invite.ready": "Invitation prête",
  "invite.code": "Code",
  "invite.shareHint":
    "Partagez le code et le mot de passe par des canaux différents.",
  "invite.done": "Terminé",
  "join.description":
    "Saisissez le code d'invitation et le mot de passe que l'organisateur vous a communiqués.",
  "join.codePlaceholder": "Code d'invitation",
  "join.joining": "Connexion au groupe…",
  "join.submit": "Rejoindre",
  "join.failed": "Impossible de rejoindre le groupe. Veuillez réessayer.",
  "join.wrongPassword":
    "Ce mot de passe ne correspond pas à cette invitation. Vérifiez-le auprès de la personne qui vous a invité et réessayez.",
  "join.invitationUsed":
    "Cette invitation a déjà été utilisée. Demandez-en une nouvelle à l'organisateur.",
  "join.alreadyInParty":
    "Vous faites déjà partie d'un groupe. Actualisez la page pour l'afficher.",
  "join.invitationNotFound":
    "Ce code d'invitation n'existe pas. Vérifiez-le auprès de la personne qui vous a invité.",

  // Sync review wizard
  "syncReview.pageTitle": "Vérifier les modifications",
  "syncReview.leaveConfirm":
    "Arrêter la vérification ? Aucun de vos choix dans cette session ne sera enregistré. Vous pouvez synchroniser à nouveau à tout moment.",
  "syncReview.success": "Synchronisé ! Votre groupe est à jour.",
  "syncReview.nothingToReview":
    "Il n'y a rien à vérifier pour le moment. Synchronisez avec votre groupe depuis Gestion des données pour rechercher des modifications.",
  "syncReview.goToDataManagement": "Aller à Gestion des données",
  "syncReview.progress": "Élément {{current}} sur {{total}}",
  "syncReview.acceptAll": "Tout accepter",
  "syncReview.rejectAll": "Tout refuser",
  "syncReview.complete": "Vérification terminée",
  "syncReview.counts":
    "{{accepted}} acceptés · {{modified}} modifiés · {{rejected}} refusés",
  "syncReview.saving": "Enregistrement de vos modifications…",
  "syncReview.savingShort": "Enregistrement…",
  "syncReview.uploadFailed":
    "Impossible d'enregistrer vos modifications dans votre groupe. Vérifiez votre connexion et réessayez.",
  "syncReview.uploadConflict":
    "Votre groupe a synchronisé de nouvelles modifications pendant votre vérification. Synchronisez à nouveau pour les récupérer : vous vérifierez tout depuis le début, y compris ce que vous venez de voir.",
  "syncReview.syncAgain": "Synchroniser à nouveau",
  "syncReview.retry": "Réessayer",
  "syncReview.uploadAndFinish": "Envoyer et terminer",
  "syncReview.cancelReview": "Annuler la vérification",
  "syncReview.kind.income": "Revenu",
  "syncReview.kind.expense": "Dépense",
  "syncReview.kind.fixedIncome": "Revenu fixe",
  "syncReview.kind.fixedExpense": "Dépense fixe",
  "syncReview.kind.bucket": "Plafond",
  "syncReview.addedBy": "Ajouté par {{name}}",
  "syncReview.addedAnonymously": "Ajouté anonymement",
  "syncReview.from": "À partir de {{month}}",
  "syncReview.removedFrom": "Retiré à partir de {{month}}",
  "syncReview.fromTheBeginning": "Depuis le début",
  "syncReview.monthlyAllowance": "{{amount}} alloués par mois",
  "syncReview.shortLabel": "{{kind}} de {{amount}} {{attribution}}",
  "syncReview.removalShortLabel": "suppression de {{kind}} {{attribution}}",
  "syncReview.bucketShortLabel": "plafond {{name}} {{attribution}}",
  "syncReview.fullHistory":
    "Nouveau : votre décision couvre tout son historique ({{count}} modifications).",
  "syncReview.accept": "Accepter",
  "syncReview.acceptLabel": "Accepter {{label}}",
  "syncReview.modify": "Modifier",
  "syncReview.modifyLabel": "Modifier {{label}}",
  "syncReview.reject": "Refuser",
  "syncReview.rejectLabel": "Refuser {{label}}",
  "syncReview.date": "Date",
  "syncReview.enterNumber": "Saisissez un nombre.",
  "syncReview.enterDate": "Saisissez une date.",
  "syncReview.saveAndAccept": "Enregistrer et accepter",
};

export default fr;
