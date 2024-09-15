import dayjs from "dayjs";
import { getCurrentMonth, getCurrentTimestamp, getCurrentYear } from "../date";
import { calculateTotal } from "../general";
import { ENTRY_TYPES_SINGULAR } from "../../constants";
import { capitalize } from "lodash";

function getSumFromEntries({ entries, absolute = false }) {
  const entriesForSum = entries.map((entry) => {
    const amount = entry.amount;
    return entry.type === ENTRY_TYPES_SINGULAR.INCOME || absolute
      ? parseFloat(amount)
      : -parseFloat(amount);
  });

  return calculateTotal(...entriesForSum);
}

function getFilteredEntriesByCategory({
  entries,
  selectedDate,
  category,
  entryTypePlural,
}) {
  const selectedYear = selectedDate.year;
  const selectedMonth = selectedDate.month;
  const entriesToFilter =
    entries[selectedYear]?.[selectedMonth]?.[entryTypePlural];
  return category.length
    ? entriesToFilter.filter((entry) => entry.categories_path.match(category))
    : entriesToFilter || [];
}

const getDatedEntries = ({ entries, year, month }) => {
  return entries?.[year]?.[month] || { incomes: [], expenses: [] };
};

/**
 * Calculates the percentage of each category's total amount relative to the total sum.
 *
 * This function transforms an array of entries to an array of categories as keys
 * and it accumulated percentages. This is ideal to summarize a list of expenses for a
 * chart.
 *
 * @param {Object} params - The parameters for the function.
 * @param {number} params.totalSum - The total sum used as the denominator for percentage calculation.
 * @param {Array<Object>} params.entries - The list of entries to process.
 * @param {string} params.entries[].amount - The raw amount value for the entry, which will be converted to a float.
 * @param {string} params.entries[].categories_path - A comma-separated string representing the category path.
 * @returns {Object} An object where each key is a category and each value is the percentage of the total sum for that category
 */
const getCategoryPercentagesFromEntries = ({ totalSum, entries }) =>
  entries.reduce((consolidatedCategories, entry) => {
    const { amount: rawAmount, categories_path } = entry;
    const category = capitalize(categories_path.split(",")[1]);
    const amount = Math.abs(parseFloat(rawAmount));
    const percentageAmount = (amount / totalSum) * 100;
    return {
      ...consolidatedCategories,
      [category]:
        (consolidatedCategories[category]
          ? consolidatedCategories[category]
          : 0) + percentageAmount,
    };
  }, {});

/*
 *  TODO: This function probably needs to be separated
 *  from the rest of the helpers as the formatting
 *  functionalities may become more complex
 */
function formatNumberForDisplay(amount) {
  /**
   * TODO: Make sure the locale settings are loaded from the browser
   * and can be configurable from a database
   * https://github.com/rivasvict/react-expenses-manager/issues/69
   */
  const USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  return isNaN(amount) ? USDollar.format(0) : USDollar.format(amount);
}

function getSum({ entryType, entries }) {
  if (entries[entryType]) {
    const entriesByType = getEntries({ entryType, entries });
    return getSumFromEntries({ entries: entriesByType });
  }
}

function getEntries({ entries, entryType }) {
  return entries[entryType];
}

function getEntryModel({ entryType, timestamp = getCurrentTimestamp() }) {
  return {
    date: timestamp,
    amount: "",
    description: "",
    type: entryType,
    categories_path: "",
  };
}

function getSelectOptionsForDisplay(selectOptions) {
  return selectOptions.map((selectOption) => ({
    name: selectOption,
    value: selectOption.toLowerCase(),
  }));
}

function getEntryCategoryOption(entryType) {
  // TODO: These categories should live somewhere else
  // in a settings or constant file

  // TODO: These categories should come from the database
  const incomeCategories = ["Salary", "Deposit", "Saving"];

  const expenseCategories = [
    "Food",
    "Alcohol",
    "Clothes",
    "Fixed expenses",
    "Health",
    "House",
    "House insurance",
    "Electricity",
    "Internet",
    "Laundry",
    "Others",
    "Parents",
    "Mobile",
    "Tech",
    "Transport",
  ];

  const categoryOptions = {
    income: getSelectOptionsForDisplay(incomeCategories),
    expense: getSelectOptionsForDisplay(expenseCategories),
  };

  return categoryOptions[entryType];
}

const getEmtpyMonthModel = () => ({
  incomes: [],
  expenses: [],
});

const getCurrentEmptyMonth = () => ({
  [getCurrentYear()]: {
    [getCurrentMonth()]: getEmtpyMonthModel(),
  },
});

// TODO: Refactor this function so it does not have that much
// Responsibility
const getGroupEntriesByDate = () => (entries) => {
  if (entries.length) {
    return entries.reduce((parsedEntries, newEntry) => {
      const newEntryDate = dayjs(newEntry.date);
      const newEntryYear = newEntryDate.year();
      const newEntryMonth = newEntryDate.month();

      const addEntryDateTreeToANewYear = () =>
        (parsedEntries[newEntryYear] = {
          [newEntryMonth]: { [`${newEntry.type}s`]: [newEntry] },
        });
      const addEntryDateTreeToANewMonth = () =>
        (parsedEntries[newEntryYear][newEntryMonth] = {
          [`${newEntry.type}s`]: [newEntry],
        });
      const addEntryDateTreeToANewType = () =>
        (parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`] = [
          newEntry,
        ]);
      const pushTheNewEntryToTheExistingType = () =>
        parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`].push(
          newEntry
        );
      // Year not created
      if (!parsedEntries[newEntryYear]) {
        addEntryDateTreeToANewYear();
        // Year created but month not created
      } else if (!parsedEntries[newEntryYear][newEntryMonth]) {
        addEntryDateTreeToANewMonth();
        // Year created and month created but not the entry type
      } else if (
        parsedEntries[newEntryYear][newEntryMonth] &&
        !parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`]
      ) {
        addEntryDateTreeToANewType();
        // Everything exists
      } else {
        pushTheNewEntryToTheExistingType();
      }

      return parsedEntries;
    }, {});
  }

  return getCurrentEmptyMonth();
};

const fillYear = ({ entries, pointerYear }) => {
  for (let i = 0; i <= 11; i++) {
    if (!entries[pointerYear]) {
      entries[pointerYear] = { [i]: getEmtpyMonthModel() };
    } else {
      entries[pointerYear][i] = getEmtpyMonthModel();
    }
  }
};

// TODO: Make a refactor here so the internal functions belong
// Into its own functions outside of getEntriesWithFilledDates
// scope
const getEntriesWithFilledDates =
  () =>
  ({ entries, firstEntryDate }) => {
    const pointerDate = dayjs(firstEntryDate);
    let pointerYear = pointerDate.year();
    let pointerMonth = pointerDate.month();
    const endDate = dayjs();
    const endYear = endDate.year();
    const endMonth = endDate.month();

    const fillAYearOfMonthsWithEmptyEntries = () => {
      fillYear({ entries, pointerYear });
      pointerMonth = 0;
      pointerYear++;
    };

    const fillMonthWithEmptyMonthModel = (currentEntriesYear) => {
      currentEntriesYear[pointerMonth] = getEmtpyMonthModel();
      advanceToTheNextDateIndexes();
    };

    const fillMonthEntries = (currentEntriesYear) => {
      const entryMonthContent = currentEntriesYear[pointerMonth];
      const currentEntriesMonth = currentEntriesYear[pointerMonth];
      if (!entryMonthContent.incomes) {
        currentEntriesMonth.incomes = [];
      }
      if (!entryMonthContent.expenses) {
        currentEntriesMonth.expenses = [];
      }
      advanceToTheNextDateIndexes();
    };

    const advanceToTheNextDateIndexes = () => {
      pointerMonth++;
      resetMonthCountToJanuaryIndex();
    };

    const resetMonthCountToJanuaryIndex = () => {
      if (pointerMonth > 11) {
        pointerMonth = 0;
        pointerYear++;
      }
    };

    while (pointerYear <= endYear && pointerMonth <= endMonth) {
      const currentEntriesYear = entries[pointerYear];
      if (!currentEntriesYear) {
        fillAYearOfMonthsWithEmptyEntries();
      } else if (!currentEntriesYear[pointerMonth]) {
        fillMonthWithEmptyMonthModel(currentEntriesYear);
      } else if (
        currentEntriesYear[pointerMonth] &&
        (!currentEntriesYear[pointerMonth].incomes ||
          !currentEntriesYear[pointerMonth].expenses)
      ) {
        fillMonthEntries(currentEntriesYear);
      } else {
        advanceToTheNextDateIndexes();
      }
    }

    return entries;
  };

/**
 * TODO: Remove the callback pattern here as it is not necessary
 */
/**
 * Function to group expenses data based on year > month
 * and fill empty data spaces (where no entries are registered
 * in a month or a year)
 * @function
 * @returns {function} a callback that does the intended purpose
 * @param {Arrat<Objec>} entries - Array of entries
 */
const getGroupedFilledEntriesByDate = () => (entries) => {
  const groupedEntriesByDate = getGroupEntriesByDate()(entries);
  return getEntriesWithFilledDates()({
    entries: groupedEntriesByDate,
    firstEntryDate: entries.length && entries[0].date,
  });
};

/**
 * Function to convert quantities in percentages
 * @param {[number]} quantities
 * @returns {[number]} percentages
 */
const quantitiesToPercentages = (quantities) => {
  if (!quantities?.length) return [];
  const totalSum = quantities.reduce(
    (sum, quantity) => sum + Math.abs(quantity),
    0
  );
  return quantities.map((quantity) => (Math.abs(quantity) / totalSum) * 100);
};

export {
  getSumFromEntries,
  formatNumberForDisplay,
  getSum,
  getEntryModel,
  getEntryCategoryOption,
  getGroupedFilledEntriesByDate,
  quantitiesToPercentages,
  getFilteredEntriesByCategory,
  getDatedEntries,
  getCategoryPercentagesFromEntries,
};
