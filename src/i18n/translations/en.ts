/**
 * English UI text — the default language and the source of truth for every
 * translation key: a key exists because it is listed here, and every other
 * language must provide the same keys (enforced by the `Translations` type in
 * ./es.ts and by ./translations.test.ts).
 *
 * Conventions:
 * - Keys are grouped by screen or component (`nav.*`, `entryForm.*`, …);
 *   `common.*` holds words shared by several screens.
 * - `{{name}}` is a placeholder filled in by `t(key, { name })`.
 * - A `_one` / `_other` pair is a plural, picked by `plural(key, count)`.
 * - `<link>…</link>` marks a span rendered by the `Trans` component.
 * - Only UI text belongs here. Data the user stores (category and bucket
 *   names, descriptions, amounts) is shown exactly as saved.
 */
const en = {
  // Shared words
  "common.cancel": "Cancel",
  "common.expenses": "Expenses",
  "common.goBack": "Go Back",
  "common.incomes": "Incomes",
  "common.savings": "Savings",
  "common.submit": "Submit",
  "common.summary": "Summary",

  // Language names, in the current UI language (Settings screen)
  "language.en": "English",
  "language.es": "Spanish",

  // Relative times and dates (dayjs format tokens for `time.dateFormat`)
  "time.justNow": "just now",
  "time.minutesAgo_one": "1 minute ago",
  "time.minutesAgo_other": "{{count}} minutes ago",
  "time.hoursAgo_one": "1 hour ago",
  "time.hoursAgo_other": "{{count}} hours ago",
  "time.daysAgo_one": "1 day ago",
  "time.daysAgo_other": "{{count}} days ago",
  "time.dateFormat": "MMM D, YYYY",

  // App bar
  "header.appName": "Expenses Tracker",
  "header.logoTitle": "Expenses Tracker logo",
  "nav.ariaLabel": "Main navigation",
  "nav.home": "Home",
  "nav.categories": "Categories",
  "nav.buckets": "Buckets",
  "nav.fixedEntries": "Fixed Entries",
  "nav.data": "Data",
  "nav.dataManagement": "Data Management",
  "accountChip.loggedOut": "Account",
  "accountChip.loggedIn": "Account: {{firstName}} {{lastName}}",
  "syncStatus.unknown": "Sync server: checking…",
  "syncStatus.online": "Sync server: online",
  "syncStatus.offline": "Sync server: offline",

  // Settings
  "settings.title": "Settings",
  "settings.language.title": "Language",
  "settings.language.description":
    "Choose the language the app is shown in. Your choice is saved on this device and applies right away.",

  // First-run data disclaimer
  "dataDisclaimer.title": "Your data stays on this device",
  "dataDisclaimer.body":
    "This app is intended for product validation purposes. Nothing you put here is stored anywhere other than this very device, and your data lives for as long as the browser's data does not get cleared. You can download a backup at any time from Data Management.",
  "dataDisclaimer.dontShowAgain": "Don't show this message again",
  "dataDisclaimer.confirm": "Got it",

  // Month stepper
  "monthHeader.previous": "Previous month",
  "monthHeader.next": "Next month",

  // Dashboard
  "dashboard.pageTitle": "Monthly Balance",
  "dashboard.addIncome": "Add Income",
  "dashboard.addExpenses": "Add Expenses",

  // Add / edit entry form
  "entryForm.pageTitle.income": "Income entry",
  "entryForm.pageTitle.expense": "Expense entry",
  "entryForm.heading.add.income": "Add new Income",
  "entryForm.heading.add.expense": "Add new Expense",
  "entryForm.heading.edit.income": "Edit Income",
  "entryForm.heading.edit.expense": "Edit Expense",
  "entryForm.amount": "Amount",
  "entryForm.amountPlaceholder.income": "Insert Income amount",
  "entryForm.amountPlaceholder.expense": "Insert Expense amount",
  "entryForm.description": "Description",
  "entryForm.optional": "(optional)",
  "entryForm.category": "Category",
  "entryForm.selectCategory": "Select a category",
  "entryForm.recurring": "Recurring (applies every month)",
  "entryForm.remove": "Remove entry",
  "entryForm.notFound": "Entry not found",

  // Searchable category dropdown
  "categorySelect.searchPlaceholder": "Search categories…",
  "categorySelect.searchLabel": "Search categories",
  "categorySelect.noMatches": "No matching categories",

  // Entry lists
  "entriesSummary.empty": "Nothing here yet for this month.",
  "entries.count_one": "{{count}} entry",
  "entries.count_other": "{{count}} entries",
  "entriesReport.pageTitle": "Monthly report",
  "entriesReport.total.incomes": "Incomes total",
  "entriesReport.total.expenses": "Expenses total",
  "entriesReport.matching.incomes": "Matching incomes",
  "entriesReport.matching.expenses": "Matching expenses",

  // Monthly summary
  "summary.pageTitle": "Monthly Summary",
  "summary.monthTotal": "{{month}} total",
  "summary.show": "Show",
  "summary.showAll": "All incomes and expenses",
  "summary.filteredTitle": "Filtered view · both lists",
  "summary.filteredTotal": "Filtered total · net",

  // Filter & sort toolbar
  "toolbar.searchEntries": "Search entries",
  // The toolbar field is narrow; its accessible name stays the full label.
  "toolbar.searchPlaceholder": "Search entries",
  "toolbar.sortEntries": "Sort entries",
  "toolbar.sortPrefix": "Sort:",
  "toolbar.openFilters": "Open filters",
  "toolbar.openFiltersActive": "Open filters ({{count}} active)",
  "toolbar.filters": "Filters",
  "sort.sortBy": "Sort by",
  "sort.default": "Default",
  "sort.date": "Date",
  "sort.amount": "Amount",
  "sort.name": "Name",
  "sort.dateNewestFirst": "Date — newest first",
  "sort.amountHighestFirst": "Amount — highest first",
  "sort.nameAToZ": "Name — A → Z",
  "sort.thenByDescription": "then by description",

  // Filters & sort sheet
  "filterSheet.heading": "Filters & sort",
  "filterSheet.close": "Close filters",
  "filterSheet.search": "Search",
  "filterSheet.searchIn": "Search in",
  "filterSheet.scopeAll": "All text",
  "filterSheet.scopeDescription": "Description only",
  "filterSheet.scopeHint":
    '"All text" matches category + description. Switch to "Description only" to scope the search to what you typed on the entry.',
  "filterSheet.filterByCategory": "Filter by category",
  "filterSheet.all.incomes": "All incomes",
  "filterSheet.all.expenses": "All expenses",
  "filterSheet.all.entries": "All entries",
  "filterSheet.sameAsToolbar": "same as toolbar",
  "filterSheet.clearAll": "Clear all",
  "filterSheet.showResults_one": "Show {{count}} result",
  "filterSheet.showResults_other": "Show {{count}} results",
  "filters.categoryChip": "Category: {{category}}",

  // Filtered banner & empty state
  "filteredBanner.title": "Filtered view",
  "filteredBanner.count": "{{shown}} of {{total}} entries",
  "filteredBanner.clear": "Clear",
  "filteredBanner.removeFilter": "Remove filter {{label}}",
  "filteredBanner.total": "Filtered total",
  "filterEmpty.title": "No entries match your filters",
  "filterEmpty.hint": "Try a different search term or a broader category.",
  "filterEmpty.clearAll": "Clear all filters",

  // Buckets
  "buckets.pageTitle": "Monthly Buckets",
  "buckets.allocation": "{{month}} allocation: {{amount}}",
  "buckets.emptyTitle": "No buckets yet",
  "buckets.emptyMessage":
    "You haven't added any buckets. Add your first bucket to start tracking your monthly spending limits.",
  "buckets.addNew": "Add new bucket",
  "bucket.edit": "Edit {{category}}",
  "bucket.spent": "Spent: {{amount}}",
  "bucket.remaining": "Remaining: {{amount}}",
  "bucket.carryOver": "Allowance {{allowance}} + carried {{carried}}",
  "bucketForm.monthlyAllowance": "Monthly allowance",
  "bucketForm.amountPlaceholder": "Insert bucket amount",
  "addBucket.pageTitle": "Buckets",
  "addBucket.noCategories":
    "Every category already has a bucket. <link>Add a new category</link> first.",
  "addBucket.categoryHint":
    "Pick one of your existing categories to give it a monthly spending limit.",
  "addBucket.allowancePlaceholder": "Insert bucket allowance",
  "addBucket.createFailed": "The bucket could not be created",
  "editBucket.pageTitle": "Edit bucket: {{name}}",
  "editBucket.hint":
    "Changes apply from the month you are viewing onward; earlier months keep their previous limit.",

  // Categories
  "categories.pageTitle": "Categories",
  "categories.subtitle": "Every expense category, with or without a bucket",
  "categories.noBucket": "(no bucket)",
  "categories.addNew": "Add new category",
  "addCategory.name": "Name",
  "addCategory.hint":
    "Categories group your expenses. You can add a spending limit (bucket) to a category later.",
  "addCategory.namePlaceholder": "Category name",
  "addCategory.createFailed": "The category could not be created",

  // Form validation
  "validation.categoryNameEmpty": "Category name cannot be empty",
  "validation.categoryExists": 'A category for "{{name}}" already exists',
  "validation.selectCategory": "Please select a category",
  "validation.bucketExists": 'A bucket for "{{name}}" already exists',
  "validation.allowanceInvalid": "Allowance must be a valid number",
  "validation.allowancePositive": "Allowance must be greater than zero",

  // Fixed (recurring) entries
  "fixedEntries.pageTitle": "Fixed entries",
  "fixedEntries.subtitle": "Recurring incomes and expenses applying to {{month}}",
  "fixedEntries.empty":
    "No recurring entries apply to this month yet. Add one from Add Income or Add Expense and switch on “Recurring”.",
  "fixedEntries.addIncome": "Add Income",
  "fixedEntries.addExpense": "Add Expense",

  // Data management
  "dataManagement.backupTitle": "Keep your data safe",
  "dataManagement.backupDescription":
    "Everything you track lives only in this browser. Download a backup file regularly so you can restore it here or on another device.",
  "dataManagement.download": "Download Backup",
  "dataManagement.restore": "Restore Backup",
  "dataManagement.restoreFailed": "The backup could not be restored",
  "dataManagement.dangerTitle": "Danger zone",
  "dataManagement.dangerDescription":
    "Remove every entry, bucket and category from this device. This cannot be undone.",
  "dataManagement.clearAll": "Clear all data",
  "dataManagement.clearConfirm":
    "This permanently deletes every entry, bucket and category stored on this device. Are you sure?",
  "backup.notJson":
    "This file is not a valid backup: it could not be read as JSON",
  "backup.invalid": "This file is not a valid backup",
  "backup.otherApp": "This file is not a valid backup for this app",
  "backup.unsupportedVersion": "Unsupported backup version: {{version}}",

  // Sync card (Data Management)
  "syncCard.title": "Sync with your party",
  "syncCard.description":
    "Pull in what your family added, review it, then merge it in.",
  "syncCard.syncButton": "Sync with party",
  "syncCard.syncing": "Syncing…",
  "syncCard.syncingStatus": "Syncing with your party…",
  "syncCard.upToDate": "You're up to date.",
  "syncCard.firstSync":
    "This is the first sync for your party. Your data is now the starting point — future syncs will compare against it.",
  "syncCard.connectionFailed":
    "Couldn't reach your party. Check your connection and try again.",
  "syncCard.unsupportedSchemaVersion":
    "This device's app version is too old to read your party's data. Update the app and sync again.",
  "syncCard.declinedBlocked":
    "This sync was declined: you've been removed from your party by its organizer. Nothing on this device was changed.",
  "syncCard.declinedCanceled":
    "This sync was declined: your party was canceled. Nothing on this device was changed.",
  "syncCard.conflict":
    "Your party synced new changes while you were syncing. Sync again to pick them up.",
  "syncCard.captionSignedOut":
    "Sign in and join a party to sync your entries across devices.",
  "syncCard.captionCheckFailed":
    "Couldn't check your party. It will retry when you reopen this screen.",
  "syncCard.captionChecking": "Checking your party…",
  "syncCard.captionNoParty": "Create or join a party to start syncing.",
  "syncCard.captionBlocked":
    "You've been removed from your party by its organizer. Sync is unavailable.",
  "syncCard.captionCanceled":
    "Your party was canceled. Create or join a new one to sync again.",
  "syncCard.neverSynced": "Never synced yet",
  "syncCard.lastSynced": "Last synced: {{when}}",

  // Sync server errors, by code — shown when the UI is not in English (the
  // server's own English wording is shown as is otherwise).
  "syncError.VALIDATION_ERROR":
    "Some of the information you entered isn't valid. Check it and try again.",
  "syncError.EMAIL_TAKEN": "An account with this email already exists.",
  "syncError.INVALID_CREDENTIALS": "Email or password is incorrect.",
  "syncError.UNAUTHORIZED": "Your session has expired. Sign in again.",
  "syncError.ALREADY_IN_PARTY": "You already belong to a party.",
  "syncError.NOT_ORGANIZER": "Only the party's organizer can do that.",
  "syncError.NO_PARTY": "You don't belong to a party yet.",
  "syncError.PARTY_CANCELED": "This party was canceled.",
  "syncError.INVITATION_NOT_FOUND": "That invitation code doesn't exist.",
  "syncError.INVITATION_WRONG_PASSWORD":
    "That password doesn't match this invitation.",
  "syncError.INVITATION_USED": "This invitation has already been used.",
  "syncError.BLOCKED":
    "You've been removed from this party by its organizer.",
  "syncError.NO_BACKUP": "Your party hasn't synced any data yet.",
  "syncError.VERSION_CONFLICT":
    "Your party synced new changes in the meantime. Sync again.",
  "syncError.CONFLICT":
    "Someone else changed this at the same time. Please try again.",
  "syncError.PAYLOAD_TOO_LARGE": "There is too much data to sync at once.",
  "syncError.NETWORK_ERROR":
    "Couldn't reach the sync server. Please try again.",
  "syncError.UNSUPPORTED_SCHEMA_VERSION":
    "This party's backup could not be read by this app version.",

  // Account & auth
  "account.pageTitle": "Account",
  "account.logOut": "Log out",
  "account.signedOut": "Signed out. Your data stays on this device.",
  "account.description":
    "Sign in to sync your entries across devices with your party.",
  "account.signIn": "Sign in",
  "account.signUp": "Sign up",
  "account.reassurance":
    "Everything still works without an account — this is only needed for syncing with a party.",
  "auth.firstName": "First Name",
  "auth.lastName": "Last Name",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.retypePassword": "Retype Password",
  "auth.firstNameRequired": "First name is required",
  "auth.lastNameRequired": "Last name is required",
  "auth.emailRequired": "Email is required",
  "auth.passwordRequired": "Password is required",
  "auth.passwordsMustMatch": "Password fields should match",
  "signIn.submitting": "Signing in…",
  "signIn.invalidCredentials": "Email or password is incorrect.",
  "signIn.failed": "Could not sign in. Please try again.",
  "signUp.submitting": "Signing up…",
  "signUp.emailTaken":
    "An account with this email already exists. Try signing in instead.",
  "signUp.failed": "Could not sign up. Please try again.",

  // Party
  "party.pageTitle": "Party",
  "party.signInPrompt": "Sign in to create or join a party.",
  "party.goToAccount": "Go to Account",
  "party.loading": "Loading your party…",
  "party.blockedStatus":
    "You've been removed from this party by its organizer.",
  "party.create": "Create a party",
  "party.createDescription":
    "Start a party to sync entries with family members.",
  "party.createConfirm":
    "Create a party? You'll become its organizer and can invite family members.",
  "party.createFailed": "Could not create the party.",
  "party.join": "Join a party",
  "party.joinDescription":
    "Have an invitation code? Join the party that invited you.",
  "party.organizer": "Organizer",
  "party.inviteHint": "Invite family members to start syncing.",
  "party.addMember": "Add a member",
  "party.cancel": "Cancel party",
  "party.onlyOrganizerCanManage":
    "Only {{name}}, the organizer, can add or remove members.",
  "party.onlyTheOrganizerCanManage":
    "Only the organizer, the organizer, can add or remove members.",
  "party.blockConfirm":
    "Block {{firstName}} {{lastName}}? This cannot be undone. They'll immediately lose the ability to sync, and entries they've already contributed stay in the party's history.",
  "party.blockFailed": "Could not block the member.",
  "party.cancelConfirm":
    "Cancel {{name}}? This cannot be undone. No member will be able to sync afterward, and nobody's local data is deleted.",
  "party.cancelFailed": "Could not cancel the party.",
  "memberRow.you": "(you)",
  "memberRow.blocked": "Blocked",
  "memberRow.block": "Block",
  "memberRow.blockLabel": "Block {{firstName}} {{lastName}}",
  "shareField.show": "Show {{label}}",
  "shareField.hide": "Hide {{label}}",
  "shareField.copy": "Copy {{label}}",
  "shareField.copied": "Copied",
  "invite.setPassword": "Set an invitation password",
  "invite.setPasswordDescription":
    "The person you invite will need this password together with the invitation code.",
  "invite.passwordPlaceholder": "Invitation password",
  "invite.generating": "Generating…",
  "invite.generate": "Generate invitation",
  "invite.createFailed": "Could not create the invitation.",
  "invite.ready": "Invitation ready",
  "invite.code": "Code",
  "invite.shareHint": "Share the code and password over different channels.",
  "invite.done": "Done",
  "join.description":
    "Enter the invitation code and password the organizer shared with you.",
  "join.codePlaceholder": "Invitation code",
  "join.joining": "Joining…",
  "join.submit": "Join",
  "join.failed": "Could not join the party. Please try again.",
  "join.wrongPassword":
    "That password doesn't match this invitation. Double-check it with whoever invited you and try again.",
  "join.invitationUsed":
    "This invitation has already been used. Ask the organizer to send you a new one.",
  "join.alreadyInParty": "You already belong to a party. Refresh to see it.",
  "join.invitationNotFound":
    "That invitation code doesn't exist. Double-check it with whoever invited you.",

  // Sync review wizard
  "syncReview.pageTitle": "Review changes",
  "syncReview.leaveConfirm":
    "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime.",
  "syncReview.success": "Synced! Your party is up to date.",
  "syncReview.nothingToReview":
    "There's nothing to review right now. Sync with your party from Data Management to check for changes.",
  "syncReview.goToDataManagement": "Go to Data Management",
  "syncReview.progress": "Item {{current}} of {{total}}",
  "syncReview.acceptAll": "Accept all",
  "syncReview.rejectAll": "Reject all",
  "syncReview.complete": "Review complete",
  "syncReview.counts":
    "{{accepted}} accepted · {{modified}} modified · {{rejected}} rejected",
  "syncReview.saving": "Saving your changes…",
  "syncReview.savingShort": "Saving…",
  "syncReview.uploadFailed":
    "Couldn't save your changes to your party. Check your connection and try again.",
  "syncReview.uploadConflict":
    "Your party synced new changes while you were reviewing. Sync again to pick them up — you'll review everything fresh, including what you just saw.",
  "syncReview.syncAgain": "Sync again",
  "syncReview.retry": "Retry",
  "syncReview.uploadAndFinish": "Upload & finish",
  "syncReview.cancelReview": "Cancel review",
  "syncReview.kind.income": "Income",
  "syncReview.kind.expense": "Expense",
  "syncReview.kind.fixedIncome": "Fixed Income",
  "syncReview.kind.fixedExpense": "Fixed Expense",
  "syncReview.kind.bucket": "Bucket",
  "syncReview.addedBy": "Added by {{name}}",
  "syncReview.addedAnonymously": "Added anonymously",
  "syncReview.from": "From {{month}}",
  "syncReview.removedFrom": "Removed from {{month}}",
  "syncReview.fromTheBeginning": "From the beginning",
  "syncReview.monthlyAllowance": "{{amount}} monthly allowance",
  "syncReview.shortLabel": "{{amount}} {{kind}} {{attribution}}",
  "syncReview.removalShortLabel": "{{kind}} removal {{attribution}}",
  "syncReview.bucketShortLabel": "{{name}} bucket {{attribution}}",
  "syncReview.fullHistory":
    "New here — your decision covers its full history ({{count}} changes).",
  "syncReview.accept": "Accept",
  "syncReview.acceptLabel": "Accept {{label}}",
  "syncReview.modify": "Modify",
  "syncReview.modifyLabel": "Modify {{label}}",
  "syncReview.reject": "Reject",
  "syncReview.rejectLabel": "Reject {{label}}",
  "syncReview.date": "Date",
  "syncReview.enterNumber": "Enter a number.",
  "syncReview.enterDate": "Enter a date.",
  "syncReview.saveAndAccept": "Save & accept",
};

export type TranslationKey = keyof typeof en;

/** The shape every language's dictionary must match, key for key. */
export type Translations = Record<TranslationKey, string>;

export default en;
