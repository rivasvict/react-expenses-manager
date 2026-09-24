import dayjs from "dayjs";
import "dayjs/locale/es";
import { upperFirst } from "lodash";
import { DEFAULT_LANGUAGE, defaultTranslator } from "../i18n";
const toMiliseconds = (seconds) => seconds * 1000;

const getCurrentYear = () => dayjs().get("year");

const getCurrentMonth = () => dayjs().get("month");

// Month names come from dayjs's own locale data; the locale is applied per
// call (never globally), so no other date formatting changes with the UI
// language. Spanish month names are lowercase mid-sentence, but every caller
// shows them as a title, hence upperFirst.
const getMonthNameDisplay = (monthNumber, language = DEFAULT_LANGUAGE) =>
  upperFirst(dayjs().month(monthNumber).locale(language).format("MMMM"));

const getCurrentTimestamp = () => toMiliseconds(dayjs().unix());

const getTimestampFromMonthAndYear = ({ month, year }) =>
  toMiliseconds(dayjs().month(month).year(year).unix());

// Builds the sortable "YYYY-MM" key for a given year and 0-indexed month. This
// is the canonical year-month identifier used to make fixed incomes/expenses
// time-aware (issue #103): comparing these keys lexicographically is equivalent
// to comparing the chronological months.
const getYearMonthKey = ({ year, month }) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

// Short human-relative rendering for the sync card's "Last synced: …"
// caption (docs/multi-user-sync/DESIGN.md §4.1). Coarse on purpose — a
// muted caption, not a clock.
//
// TODO:
// This module has no test file. formatRelativeTime is only exercised
// end-to-end through src/integrationTests/syncNoWizard.test.tsx ("Last
// synced: just now"); the minute/hour/day thresholds and the calendar-date
// fallback have no direct coverage, nor do the older helpers above.
// Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/160
const formatRelativeTime = (
  timestampMs,
  nowMs = Date.now(),
  { t, plural, language } = defaultTranslator
) => {
  const elapsedMs = Math.max(0, nowMs - timestampMs);
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return t("time.justNow");
  if (minutes < 60) return plural("time.minutesAgo", minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural("time.hoursAgo", hours);
  const days = Math.floor(hours / 24);
  if (days < 30) return plural("time.daysAgo", days);
  return dayjs(timestampMs).locale(language).format(t("time.dateFormat"));
};

export {
  getCurrentYear,
  getCurrentMonth,
  getMonthNameDisplay,
  getCurrentTimestamp,
  getTimestampFromMonthAndYear,
  getYearMonthKey,
  formatRelativeTime,
};
