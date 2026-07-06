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

export {
  getCurrentYear,
  getCurrentMonth,
  getMonthNameDisplay,
  getCurrentTimestamp,
  getTimestampFromMonthAndYear,
  getYearMonthKey,
};
