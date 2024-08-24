import dayjs from "dayjs";
const toMiliseconds = (seconds) => seconds * 1000;

const getCurrentYear = () => dayjs().get("year");

const getCurrentMonth = () => dayjs().get("month");

const getMonthNameDisplay = (monthNumber) =>
  dayjs().month(monthNumber).format("MMMM");

const getCurrentTimestamp = () => toMiliseconds(dayjs().unix());

const getTimestampFromMonthAndYear = ({ month, year }) =>
  toMiliseconds(dayjs().month(month).year(year).unix());

export {
  getCurrentYear,
  getCurrentMonth,
  getMonthNameDisplay,
  getCurrentTimestamp,
  getTimestampFromMonthAndYear,
};
