import dayjs from "dayjs";
const toMiliseconds = (seconds) => seconds * 1000;

const getCurrentYear = () => dayjs().get("year");

const getCurrentMonth = () => dayjs().get("month");

const getMonthNameDisplay = (monthNumber) =>
  dayjs().month(monthNumber).format("MMMM");

const getCurrentTimestamp = () => toMiliseconds(dayjs().unix());

const getTimestampFromMonthAndYear = ({ month, year }) =>
  toMiliseconds(dayjs().month(month).year(year).unix());

// Builds the sortable "YYYY-MM" key for a given year and 0-indexed month. This
// is the canonical year-month identifier used to make fixed incomes/expenses
// time-aware (issue #103): comparing these keys lexicographically is equivalent
// to comparing the chronological months.
const getYearMonthKey = ({ year, month }) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

// Short human-relative rendering for "Last synced: …" captions. Coarse on
// purpose — a muted caption, not a clock.
const formatRelativeTime = (timestampMs, nowMs = Date.now()) => {
  const elapsedMs = Math.max(0, nowMs - timestampMs);
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  return dayjs(timestampMs).format("MMM D, YYYY");
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
