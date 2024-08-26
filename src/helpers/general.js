function calculateTotal(...numbersToSum) {
  return (
    numbersToSum.reduce((accumulated, currentNumber) => {
      accumulated = parseFloat(accumulated) + parseFloat(currentNumber);
      return accumulated;
    }, 0) || 0
  );
}

function setObjectToSessionStorage(objectToSet) {
  const receivedType = typeof objectToSet;
  if (receivedType === "object") {
    for (const key in objectToSet) {
      sessionStorage.setItem(key, objectToSet[key]);
    }
  } else {
    throw new Error(
      `setObjectToSessionStorage: MUST receive an object, it received ${receivedType} instead, please make sure to send an object to setObjectToSessionStorage function as a parameter`
    );
  }
}

const postConfig = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const postConfigAuthenticated = {
  ...postConfig,
  credentials: "include",
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

const doesAdjacentDateExist = ({
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

/**
 * Just a function that adds the viewport for mobile devices that considers
 * only the visible part. Thus avoiding cut of elements in mobile devices below
 * the browser bars.
 *
 * Use in conjunction with `height: calc(var(--vh, 1vh) * 100);` setting in css
 * Credit to: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
 */
const addViewHeightMobileConfig = () => {
  // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
  let vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

export {
  calculateTotal,
  setObjectToSessionStorage,
  postConfig,
  postConfigAuthenticated,
  getNewSelectedDate,
  getAdjacentDate,
  doesAdjacentDateExist,
  addViewHeightMobileConfig,
};
