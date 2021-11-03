import dayjs from 'dayjs';

const getCurrentYear = () => dayjs().get('year');

const getCurrentMonth = () => dayjs().get('month');

const getMonthNameDisplay = monthNumber => dayjs().month(monthNumber).format('MMMM');

export {
  getCurrentYear,
  getCurrentMonth,
  getMonthNameDisplay
};