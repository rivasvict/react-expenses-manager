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
  "settings.currency.title": "Devise",
  "settings.currency.description":
    "Choisissez la devise dans laquelle vos montants sont affichés. Seuls le symbole et l'écriture des montants changent : rien n'est converti. Votre choix est enregistré uniquement sur cet appareil et n'est jamais partagé lors de la synchronisation.",
  "settings.language.hint": "S'applique immédiatement",
  "settings.currency.hint": "Symbole et format uniquement",
  "settings.privacy.title": "Mode confidentialité",
  "settings.privacy.hint":
    "Floute les chiffres à l'ouverture de l'app jusqu'à ce que vous les affichiez",
  "settings.sheet.close": "Fermer",
  "currency.USD": "Dollar américain",
  "currency.EUR": "Euro",
  "currency.GBP": "Livre sterling",
  "currency.CAD": "Dollar canadien",
  "currency.AUD": "Dollar australien",
  "currency.MXN": "Peso mexicain",
  "currency.BRL": "Réal brésilien",
  "currency.COP": "Peso colombien",
  "currency.ARS": "Peso argentin",
  "currency.CLP": "Peso chilien",
  "currency.JPY": "Yen japonais",
  "currency.INR": "Roupie indienne",

  "version.label": "Version {{version}}",

  // First-run data disclaimer
  "dataDisclaimer.title": "Vos données restent sur cet appareil",
  "dataDisclaimer.body":
    "Cette application sert à valider le produit. Rien de ce que vous saisissez n'est stocké ailleurs que sur cet appareil, et vos données sont conservées tant que les données du navigateur ne sont pas effacées. Vous pouvez télécharger une sauvegarde à tout moment depuis Gestion des données.",
  "dataDisclaimer.dontShowAgain": "Ne plus afficher ce message",
  "dataDisclaimer.confirm": "Compris",

  // Privacy mode (Settings switch; the dashboard's figures blur until shown)
  "privacy.show": "Afficher les chiffres",
  "privacy.hide": "Masquer les chiffres",
  "privacy.amountHidden": "Montant masqué",
  "privacy.changeHidden": "Variation en pourcentage masquée",
  "privacy.chartHidden": "Graphique masqué",

  // Month stepper
  "monthHeader.previous": "Mois précédent",
  "monthHeader.next": "Mois suivant",
  "monthHeader.picker.title": "Aller à un mois",
  "monthHeader.picker.close": "Fermer",
  "monthHeader.picker.previousYear": "Année précédente",
  "monthHeader.picker.nextYear": "Année suivante",
  "monthHeader.picker.legendSelected": "Sélectionné",
  "monthHeader.picker.legendDimmed": "Grisé : pas encore de données",

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
  "savingsTrend.view.group": "Afficher",
  "savingsTrend.view.total": "Total épargné",
  "savingsTrend.view.change": "Variation",
  "savingsTrend.total.label": "Total épargné, {{span}}",
  "savingsTrend.total.months_one": "{{count}} mois",
  "savingsTrend.total.months_other": "{{count}} mois",
  "savingsTrend.total.average": "{{amount}} en moyenne par mois",
  "savingsTrend.total.note":
    "Chaque point est ce que vous avez épargné jusque-là dans cette période. Il monte les mois où vous épargnez et baisse ceux où vous dépensez trop.",
  "savingsTrend.total.key.zero": "Ligne zéro",
  "savingsTrend.total.tooltipMonth": "{{amount}} ce mois-ci",
  "savingsTrend.total.chartLabel":
    "Total épargné de {{from}} à {{to}}, pour finir à {{value}}",
  "savingsTrend.table.total": "Total à ce jour",
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

  // Category trends (Savings trend's Categories view)
  "categoryTrends.pageTitle":
    "Évolution par catégorie",
  "categoryTrends.scope.group":
    "Évolution de",
  "categoryTrends.scope.savings":
    "Épargne",
  "categoryTrends.scope.categories":
    "Catégories",
  "categoryTrends.subtitle":
    "{{end}} vs {{reference}}, plus forte variation d'abord.",
  "categoryTrends.was":
    "avant {{amount}}",
  "categoryTrends.new":
    "Nouveau",
  "categoryTrends.hint":
    "Touchez une catégorie pour voir toute son évolution.",
  "categoryTrends.back":
    "Toutes les catégories",
  "categoryTrends.rowLabel":
    "{{name}}, {{amount}}, {{change}} vs {{reference}}",
  "categoryTrends.rowLabelNew":
    "{{name}}, {{amount}}, nouveau, avant {{was}}",
  "categoryTrends.view.perMonth":
    "Par mois",
  "categoryTrends.kind.expense":
    "Catégorie de dépense",
  "categoryTrends.kind.income":
    "Catégorie de revenu",
  "categoryTrends.headline.perMonth":
    "{{category}}, {{span}}",
  "categoryTrends.headline.change":
    "{{category}}, {{end}} vs {{reference}}",
  "categoryTrends.key.spent":
    "Dépensé en {{reference}}",
  "categoryTrends.key.earned":
    "Perçu en {{reference}}",
  "categoryTrends.key.spentMonth":
    "Dépensé ce mois-là",
  "categoryTrends.key.earnedMonth":
    "Perçu ce mois-là",
  "categoryTrends.key.less":
    "Moins",
  "categoryTrends.key.more":
    "Plus",
  "categoryTrends.note.perMonth.expense":
    "Chaque point est ce que vous avez dépensé dans cette catégorie ce mois-là.",
  "categoryTrends.note.perMonth.income":
    "Chaque point est ce que vous avez perçu dans cette catégorie ce mois-là.",
  "categoryTrends.note.change.expense":
    "Vert quand vous avez dépensé moins qu'en {{reference}}, rouge quand vous avez dépensé plus.",
  "categoryTrends.note.change.income":
    "Vert quand vous avez perçu plus qu'en {{reference}}, rouge quand vous avez perçu moins.",
  "categoryTrends.chartLabel.perMonth":
    "{{category}} par mois, de {{from}} à {{to}}",
  "categoryTrends.chartLabel.change":
    "{{category}} par rapport à {{reference}}, de {{from}} à {{to}}",
  "categoryTrends.table.caption":
    "Montants mensuels",
  "categoryTrends.table.month":
    "Mois",
  "categoryTrends.table.amount":
    "Montant",
  "categoryTrends.empty.expense.title":
    "Aucune dépense entre {{from}} et {{to}}",
  "categoryTrends.empty.expense.body":
    "Ajoutez une dépense et sa catégorie apparaîtra ici avec son évolution.",
  "categoryTrends.empty.expense.action":
    "Ajouter une dépense",
  "categoryTrends.empty.income.title":
    "Aucun revenu entre {{from}} et {{to}}",
  "categoryTrends.empty.income.body":
    "Ajoutez un revenu et sa catégorie apparaîtra ici avec son évolution.",
  "categoryTrends.empty.income.action":
    "Ajouter un revenu",
  "categoryTrends.none.expense.title":
    "Aucune dépense en {{category}} sur cette période",
  "categoryTrends.none.expense.body":
    "Il n'y a aucune dépense dans cette catégorie entre {{from}} et {{to}}. Choisissez une période plus large ou une autre catégorie.",
  "categoryTrends.none.income.title":
    "Aucun revenu en {{category}} sur cette période",
  "categoryTrends.none.income.body":
    "Il n'y a aucun revenu dans cette catégorie entre {{from}} et {{to}}. Choisissez une période plus large ou une autre catégorie.",
  "categoryTrends.none.action":
    "Choisir une autre catégorie",
  "categoryTrends.picker.title":
    "Choisissez une catégorie",
  "categoryTrends.picker.expenses":
    "Catégories de dépense",
  "categoryTrends.picker.incomes":
    "Catégories de revenu",
  "categoryTrends.picker.rowLabel":
    "{{kind}} : {{name}}. Modifier",

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

  // Categories (category management)
  "categories.pageTitle": "Catégories",
  "categories.tabExpenses": "Dépenses",
  "categories.tabIncomes": "Revenus",
  "categories.tabsLabel": "Type de catégorie",
  "categories.lead": "Touchez une catégorie pour la renommer, voir où elle est utilisée ou la supprimer.",
  "categories.addExpense": "Ajouter une catégorie de dépense",
  "categories.addIncome": "Ajouter une catégorie de revenu",
  "categories.expenseCount_one": "{{count}} dépense",
  "categories.expenseCount_other": "{{count}} dépenses",
  "categories.incomeCount_one": "{{count}} revenu",
  "categories.incomeCount_other": "{{count}} revenus",
  "categories.bucketPerMonth": "Plafond {{amount}}/mois",
  "categories.unused": "Pas encore utilisée",
  "categories.emptyExpenseTitle": "Aucune catégorie de dépense pour l’instant",
  "categories.emptyExpenseText":
    "Chaque dépense a besoin d’une catégorie pour que vous voyiez où va votre argent, comme Alimentation ou Loyer. Créez la première pour commencer à enregistrer des dépenses.",
  "categories.emptyIncomeTitle": "Aucune catégorie de revenu pour l’instant",
  "categories.emptyIncomeText":
    "Chaque revenu a besoin d’une catégorie pour que vous voyiez d’où vient votre argent, comme Salaire ou Freelance. Créez la première pour commencer à enregistrer des revenus.",
  "categories.sheetClose": "Fermer",
  "addCategory.namePlaceholder": "Nom de la catégorie",
  "addCategory.createFailed": "La catégorie n'a pas pu être créée",
  "categorySheet.expenseType": "Catégorie de dépense",
  "categorySheet.incomeType": "Catégorie de revenu",
  "categorySheet.statExpenses": "dépenses",
  "categorySheet.statIncomes": "revenus",
  "categorySheet.statTotal": "au total",
  "categorySheet.statBucket": "plafond / mois",
  "categorySheet.noBucket": "sans plafond",
  "categorySheet.name": "Nom",
  "categorySheet.renameImpactBucket_one":
    "En enregistrant, <b>1 dépense existante</b> et le plafond de {{amount}} passent de « {{name}} » au nouveau nom. Les appareils synchronisés reçoivent aussi le changement.",
  "categorySheet.renameImpactBucket_other":
    "En enregistrant, <b>{{count}} dépenses existantes</b> et le plafond de {{amount}} passent de « {{name}} » au nouveau nom. Les appareils synchronisés reçoivent aussi le changement.",
  "categorySheet.renameImpact_one":
    "En enregistrant, <b>1 dépense existante</b> passe de « {{name}} » au nouveau nom. Les appareils synchronisés reçoivent aussi le changement.",
  "categorySheet.renameImpact_other":
    "En enregistrant, <b>{{count}} dépenses existantes</b> passent de « {{name}} » au nouveau nom. Les appareils synchronisés reçoivent aussi le changement.",
  "categorySheet.renameImpactIncome_one":
    "En enregistrant, <b>1 revenu existant</b> passe de « {{name}} » au nouveau nom. Les appareils synchronisés reçoivent aussi le changement.",
  "categorySheet.renameImpactIncome_other":
    "En enregistrant, <b>{{count}} revenus existants</b> passent de « {{name}} » au nouveau nom. Les appareils synchronisés reçoivent aussi le changement.",
  "categorySheet.save": "Enregistrer",
  "categorySheet.saveFailed": "La catégorie n'a pas pu être enregistrée",
  "categorySheet.dangerZone": "Zone de danger",
  "categorySheet.deleteHint_one": "En la supprimant, nous vous demanderons où déplacer sa dépense.",
  "categorySheet.deleteHint_other": "En la supprimant, nous vous demanderons où déplacer ses {{count}} dépenses.",
  "categorySheet.deleteHintIncome_one": "En la supprimant, nous vous demanderons où déplacer son revenu.",
  "categorySheet.deleteHintIncome_other": "En la supprimant, nous vous demanderons où déplacer ses {{count}} revenus.",
  "categorySheet.unusedHint": "Aucune opération n’utilise cette catégorie.",
  "categorySheet.delete": "Supprimer la catégorie",
  "categorySheet.duplicateExpense": "Une catégorie de dépense « {{name}} » existe déjà.",
  "categorySheet.duplicateIncome": "Une catégorie de revenu « {{name}} » existe déjà.",
  "deleteSheet.title": "Supprimer « {{name}} » ?",
  "deleteSheet.warningBucket_one":
    "<b>Action irréversible.</b> Elle modifie vos données existantes : 1 dépense passe dans la catégorie choisie ci-dessous et le plafond de {{amount}} est supprimé.",
  "deleteSheet.warningBucket_other":
    "<b>Action irréversible.</b> Elle modifie vos données existantes : {{count}} dépenses passent dans les catégories choisies ci-dessous et le plafond de {{amount}} est supprimé.",
  "deleteSheet.warning_one":
    "<b>Action irréversible.</b> Elle modifie vos données existantes : 1 dépense passe dans la catégorie choisie ci-dessous.",
  "deleteSheet.warning_other":
    "<b>Action irréversible.</b> Elle modifie vos données existantes : {{count}} dépenses passent dans les catégories choisies ci-dessous.",
  "deleteSheet.warningIncome_one":
    "<b>Action irréversible.</b> Elle modifie vos données existantes : 1 revenu passe dans la catégorie choisie ci-dessous.",
  "deleteSheet.warningIncome_other":
    "<b>Action irréversible.</b> Elle modifie vos données existantes : {{count}} revenus passent dans les catégories choisies ci-dessous.",
  "deleteSheet.setAllExpenses": "Mettre toutes les dépenses dans",
  "deleteSheet.setAllIncomes": "Mettre tous les revenus dans",
  "deleteSheet.chooseCategory": "Choisissez une catégorie",
  "deleteSheet.applyAll": "Appliquer à tout",
  "deleteSheet.choose": "Choisir…",
  "deleteSheet.rowLabel": "Catégorie pour {{description}}",
  "deleteSheet.monthGroup": "{{month}} {{year}}",
  "deleteSheet.recurring": "Récurrentes",
  "deleteSheet.stillNeed_one": "1 dépense attend encore une catégorie.",
  "deleteSheet.stillNeed_other": "{{count}} dépenses attendent encore une catégorie.",
  "deleteSheet.stillNeedIncome_one": "1 revenu attend encore une catégorie.",
  "deleteSheet.stillNeedIncome_other": "{{count}} revenus attendent encore une catégorie.",
  "deleteSheet.confirm_one": "Supprimer et déplacer 1 dépense",
  "deleteSheet.confirm_other": "Supprimer et déplacer {{count}} dépenses",
  "deleteSheet.confirmIncome_one": "Supprimer et déplacer 1 revenu",
  "deleteSheet.confirmIncome_other": "Supprimer et déplacer {{count}} revenus",
  "deleteSheet.unusedWarning":
    "<b>Action irréversible.</b> Aucune opération n’utilise cette catégorie, donc rien d’autre ne change.",
  "deleteSheet.blockedTitle": "Impossible de supprimer « {{name}} » pour l’instant",
  "deleteSheet.blockedIncome_one":
    "1 revenu utilise {{name}} et c’est votre seule catégorie de revenu, il n’y a donc nulle part où le déplacer. Ajoutez d’abord une autre catégorie de revenu, puis supprimez celle-ci.",
  "deleteSheet.blockedIncome_other":
    "{{count}} revenus utilisent {{name}} et c’est votre seule catégorie de revenu, il n’y a donc nulle part où les déplacer. Ajoutez d’abord une autre catégorie de revenu, puis supprimez celle-ci.",
  "deleteSheet.blockedExpense_one":
    "1 dépense utilise {{name}} et c’est votre seule catégorie de dépense, il n’y a donc nulle part où la déplacer. Ajoutez d’abord une autre catégorie de dépense, puis supprimez celle-ci.",
  "deleteSheet.blockedExpense_other":
    "{{count}} dépenses utilisent {{name}} et c’est votre seule catégorie de dépense, il n’y a donc nulle part où les déplacer. Ajoutez d’abord une autre catégorie de dépense, puis supprimez celle-ci.",
  "deleteSheet.deleteFailed": "La catégorie n'a pas pu être supprimée",
  "addSheet.titleExpense": "Nouvelle catégorie de dépense",
  "addSheet.titleIncome": "Nouvelle catégorie de revenu",
  "addSheet.hintExpense": "Le nom doit être unique parmi vos catégories de dépense.",
  "addSheet.hintIncome": "Le nom doit être unique parmi vos catégories de revenu.",
  "addSheet.create": "Créer la catégorie",

  // Onboarding wizard (new users only)
  "onboarding.ariaLabel": "Configurez votre espace",
  "onboarding.step": "Étape {{n}} sur {{total}}",
  "onboarding.skip": "Passer la configuration",
  "onboarding.next": "Suivant",
  "onboarding.back": "Retour",
  "onboarding.start": "Commencer le suivi",
  "onboarding.welcome": "Bienvenue ! Configurons votre espace",
  "onboarding.prefsLead":
    "Trois choix rapides. Vous pourrez tous les modifier plus tard dans les Réglages.",
  "onboarding.currencyHint": "symbole uniquement, rien n’est converti",
  "onboarding.privacy": "Confidentialité",
  "onboarding.privacyHint":
    "Masque les montants du tableau de bord jusqu’à ce que vous touchiez l’œil",
  "onboarding.expensesTitle": "Vos dépenses, c’est quoi ?",
  "onboarding.expensesLead":
    "Choisissez des catégories de dépense dans notre liste ou ajoutez les vôtres.",
  "onboarding.incomesTitle": "D’où vient l’argent ?",
  "onboarding.incomesLead":
    "Choisissez des catégories de revenu dans notre liste ou ajoutez les vôtres.",
  "onboarding.ownLabel": "Ajoutez la vôtre",
  "onboarding.add": "Ajouter",
  "onboarding.selectAll": "Tout",
  "onboarding.clear": "Aucune",
  "onboarding.selectedOf": "{{selected}} sur {{total}} choisies",
  "onboarding.selected": "{{count}} choisies",
  "onboarding.selectedNone": "0 choisie · aucune, c’est bien aussi",
  "onboarding.expensesNone":
    "Commencer sans catégorie, c’est très bien. Ajoutez-en plus tard depuis Catégories ou en saisissant une dépense.",
  "onboarding.incomesNone":
    "Commencer sans catégorie, c’est très bien. Ajoutez-en plus tard depuis Catégories ou en saisissant un revenu.",
  "onboarding.bucketsTitle": "Définissez des plafonds mensuels",
  "onboarding.optional": "(facultatif)",
  "onboarding.bucketsLead":
    "Un plafond fixe ce que vous prévoyez de dépenser dans une catégorie de dépense chaque mois.",
  "onboarding.limit": "Plafond",
  "onboarding.limitFor": "Plafond mensuel de {{category}}",
  "onboarding.bucketsSummary_one": "{{count}} plafond · {{amount}} par mois",
  "onboarding.bucketsSummary_other": "{{count}} plafonds · {{amount}} par mois",
  "onboarding.bucketsEmptyTitle": "Aucune catégorie de dépense à budgéter",
  "onboarding.bucketsEmptyText":
    "Les plafonds portent sur des catégories de dépense : il n’y a donc encore rien à définir. Vous pouvez en ajouter à tout moment depuis Plafonds.",
  "onboarding.reviewTitle": "Tout est prêt",
  "onboarding.reviewLead":
    "Voici ce que nous allons créer. Rien n’est enregistré avant la fin.",
  "onboarding.edit": "Modifier",
  "onboarding.editSection": "Modifier {{section}}",
  "onboarding.reviewPreferences": "Préférences",
  "onboarding.reviewExpenses_one": "{{count}} catégorie de dépense",
  "onboarding.reviewExpenses_other": "{{count}} catégories de dépense",
  "onboarding.reviewIncomes_one": "{{count}} catégorie de revenu",
  "onboarding.reviewIncomes_other": "{{count}} catégories de revenu",
  "onboarding.reviewOwn": "Les vôtres : {{names}}",
  "onboarding.reviewBuckets_one": "{{count}} plafond",
  "onboarding.reviewBuckets_other": "{{count}} plafonds",
  "onboarding.reviewBucketsTotal": "{{amount}} par mois au total",
  "onboarding.reviewNoExpenses": "Aucune catégorie de dépense",
  "onboarding.reviewNoIncomes": "Aucune catégorie de revenu",
  "onboarding.reviewNoCategoriesHint":
    "Ajoutez-en à tout moment depuis Catégories",
  "onboarding.reviewNoBuckets": "Aucun plafond",
  "onboarding.reviewNoBucketsHint": "Ajoutez-en à tout moment depuis Plafonds",
  "onboarding.privacyOn": "Mode confidentialité activé",
  "onboarding.privacyOff": "Mode confidentialité désactivé",

  // Form validation
  "validation.categoryNameEmpty": "Le nom de la catégorie ne peut pas être vide",
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
  "syncReview.categoryRenamed": "Catégorie renommée · pour information",
  "syncReview.categoryDeleted": "Catégorie supprimée · pour information",
  "syncReview.renamedBy": "{{type}} · renommée par {{name}} le {{date}}",
  "syncReview.deletedBy": "{{type}} · supprimée par {{name}} le {{date}}",
  "syncReview.renamedOn": "{{type}} · renommée le {{date}}",
  "syncReview.deletedOn": "{{type}} · supprimée le {{date}}",
  "syncReview.yourEntriesChange": "Vos dépenses qui changent",
  "syncReview.yourEntriesChangeIncome": "Vos revenus qui changent",
  "syncReview.yourEntriesMove": "Vos dépenses qui sont déplacées",
  "syncReview.yourEntriesMoveIncome": "Vos revenus qui sont déplacés",
  "syncReview.showMore": "Afficher {{count}} de plus",
  "syncReview.continue": "Continuer",
  "syncReview.cantReject": "Les changements de catégorie ne peuvent pas être refusés.",
};

export default fr;
