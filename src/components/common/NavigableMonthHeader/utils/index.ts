export const doesAdjacentDateExist = ({
  dateAdjacencyType,
  selectedDate,
  entries,
}) => {
  const neighboringDate = getAdjacentDate({
    dateAdjacencyType,
    referenceDate: selectedDate,
  });
  const adjacentYear = neighboringDate.year;
  const adjacentMonth = neighboringDate.month;

  return entries[adjacentYear] && entries[adjacentYear][adjacentMonth];
};

// TODO: Use the implementation of dayjs instead of this function
/*
  Function to obtain the previous or next date in years and months
*/
const getAdjacentDate = ({ dateAdjacencyType, referenceDate }) => {
  const firstMonthOfTheYearIndex = 0;
  const lastMonthOfTheYearIndex = 11;
  let year = referenceDate.year;
  let month =
    dateAdjacencyType === "prev"
      ? referenceDate.month - 1
      : referenceDate.month + 1;
  // Reset the month and change the year;
  if (month < firstMonthOfTheYearIndex || month > lastMonthOfTheYearIndex) {
    month =
      dateAdjacencyType === "prev"
        ? lastMonthOfTheYearIndex
        : firstMonthOfTheYearIndex;
    year =
      dateAdjacencyType === "prev"
        ? referenceDate.year - 1
        : referenceDate.year + 1;
  }
  return { year, month };
};
const getNewSelectedDate = ({
  currentSelectedDate,
  dateAdjacencyType,
  entries,
}) => {
  const { year, month } = getAdjacentDate({
    dateAdjacencyType,
    referenceDate: currentSelectedDate,
  });

  if (!entries[year] || !entries[year][month]) {
    return currentSelectedDate;
  }

  const newSelectedDate = {
    month: month,
    year: year,
  };

  return newSelectedDate;
};

export const handleDateSelectionPointers = ({
  entries,
  selectedDate,
  onSelectedDateChange,
  dateAdjacencyType,
}) =>
  onSelectedDateChange(
    getNewSelectedDate({
      entries,
      dateAdjacencyType,
      currentSelectedDate: selectedDate,
    })
  );
