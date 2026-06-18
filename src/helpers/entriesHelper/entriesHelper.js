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

const calculatePercentage = (part, whole, numberOfDigits = 2) => {
  if (!whole)
    throw new Error(
      `The whole of the part cannot be undefined or 0. got: ${whole}`
    );
  return parseFloat(((part / whole) * 100).toFixed(numberOfDigits));
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
    const percentageAmount = calculatePercentage(amount, totalSum);
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

// TODO: These categories should live somewhere else in a settings or constant
// file and ultimately come from the database. They act as the seed list the
// user starts with before creating their own categories (see issue #71).
const INCOME_CATEGORIES = ["Salary", "Deposit", "Saving"];

const EXPENSE_CATEGORIES = [
  "House (Rent)",
  "Transportation",
  "Mobile phone plan",
  "Subscriptions",
  "Bank fees",
  "Laundry",
  "Internet",
  "Hydro",
  "Donation",
  "Eating out",
  "Fun activities",
  "Food",
  "Alcohol",
  "Travel",
  "Sports",
  "House stuff",
  "Unexpected",
  "Beauty",
  "Person 1 bucket",
  "Person 2 bucket",
  "Education",
  "Insurance House",
  "Health",
  "Baby Stuff",
  "Car",
  "Car parking",
  "Car insurance",
  "Gas",
  "Car expenses",
];

/**
 * Builds the ordered list of expense category names the user can choose from.
 *
 * Categories can exist independently of buckets (issue #100/#71): the user
 * creates a category on its own, and only later (optionally) attaches a
 * spending limit by creating a bucket for it. This merges the seed
 * categories, the user's standalone categories, and the user's bucket names
 * so every one of them becomes immediately selectable, while keeping the
 * comparison case-insensitive to avoid duplicates like "Gym"/"gym".
 *
 * @param {Object} [buckets={}] - `{ [bucketName]: allowance }` from the store.
 * @param {Array<string>} [categories=[]] - Standalone categories without a bucket yet.
 * @returns {Array<string>} The deduplicated, ordered category names.
 */
function getExpenseCategoryNames(buckets = {}, categories = []) {
  const categoryNames = [...EXPENSE_CATEGORIES];
  const seen = new Set(categoryNames.map((category) => category.toLowerCase()));

  [...(categories || []), ...Object.keys(buckets || {})].forEach((name) => {
    const normalized = name.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      categoryNames.push(name);
    }
  });

  return categoryNames;
}

/**
 * Returns the category select options for an entry type. Expense categories are
 * augmented with the user-created categories and buckets so newly added ones show up.
 *
 * @param {string} entryType - "income" or "expense".
 * @param {Object} [buckets={}] - `{ [bucketName]: allowance }` from the store.
 * @param {Array<string>} [categories=[]] - Standalone categories without a bucket yet.
 */
function getEntryCategoryOption(entryType, buckets = {}, categories = []) {
  const categoryOptions = {
    income: getSelectOptionsForDisplay(INCOME_CATEGORIES),
    expense: getSelectOptionsForDisplay(
      getExpenseCategoryNames(buckets, categories)
    ),
  };

  return categoryOptions[entryType];
}

/**
 * Validates a new category name (issue #71/#100): it must be non-empty and
 * unique (case-insensitive) among the existing categories and buckets, so we
 * never create orphan or duplicated categories.
 *
 * @param {Object} params
 * @param {string} params.name - The proposed category name.
 * @param {Object} [params.buckets={}] - Existing `{ [bucketName]: allowance }`.
 * @param {Array<string>} [params.categories=[]] - Existing standalone categories.
 * @returns {string|null} An error message, or null when the name is valid.
 */
function getCategoryValidationError({ name, buckets = {}, categories = [] }) {
  const trimmedName = (name || "").trim();

  if (!trimmedName) {
    return "Category name cannot be empty";
  }

  const alreadyExists = getExpenseCategoryNames(buckets, categories).some(
    (existingName) => existingName.toLowerCase() === trimmedName.toLowerCase()
  );

  if (alreadyExists) {
    return `A category for "${trimmedName}" already exists`;
  }

  return null;
}

/**
 * Returns the categories that do not have a bucket (spending limit) yet, i.e.
 * the ones selectable when creating a new bucket (issue #100). This includes
 * the seed expense categories as well as standalone user-created ones, since
 * either kind can be picked when setting up a bucket.
 *
 * @param {Object} params
 * @param {Object} [params.buckets={}] - Existing `{ [bucketName]: allowance }`.
 * @param {Array<string>} [params.categories=[]] - Standalone categories without a bucket yet.
 * @returns {Array<string>}
 */
function getCategoriesWithoutBucket({ buckets = {}, categories = [] }) {
  const bucketNames = new Set(
    Object.keys(buckets || {}).map((bucketName) => bucketName.toLowerCase())
  );
  return getExpenseCategoryNames(buckets, categories).filter(
    (categoryName) => !bucketNames.has(categoryName.toLowerCase())
  );
}

/**
 * Validates a bucket (spending limit) creation request (issue #100): a
 * category must be selected and must not already have a bucket.
 *
 * @param {Object} params
 * @param {string} params.categoryName - The selected category name.
 * @param {Object} [params.buckets={}] - Existing `{ [bucketName]: allowance }`.
 * @returns {string|null} An error message, or null when the selection is valid.
 */
function getBucketValidationError({ categoryName, buckets = {} }) {
  const trimmedName = (categoryName || "").trim();

  if (!trimmedName) {
    return "Please select a category";
  }

  const alreadyExists = Object.keys(buckets || {}).some(
    (bucketName) => bucketName.toLowerCase() === trimmedName.toLowerCase()
  );

  if (alreadyExists) {
    return `A bucket for "${trimmedName}" already exists`;
  }

  return null;
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
      const newEntryDate = dayjs(parseInt(newEntry.date));
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
    const pointerDate = dayjs(parseInt(firstEntryDate));
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

    while (pointerYear < endYear || (pointerYear === endYear && pointerMonth <= endMonth)) {
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
  if (!entries.length) {
    return getCurrentEmptyMonth();
  }
  const groupedEntriesByDate = getGroupEntriesByDate()(entries);
  return getEntriesWithFilledDates()({
    entries: groupedEntriesByDate,
    firstEntryDate: entries[0].date,
  });
};

/**
 * Sums the expense amounts of a single month grouped by bucket.
 *
 * Spending for a bucket is the accumulated amount of every expense whose
 * `categories_path` matches the (lowercased) bucket name, following the
 * `,<category>,` convention used across the app.
 *
 * @param {Object} params
 * @param {Array<Object>} params.expenses - Expense entries of a single month.
 * @param {Array<string>} params.bucketNames - The bucket names to compute spending for.
 * @returns {Object} bucketName -> total spent in the month for that bucket.
 */
const getMonthSpendingByBucket = ({ expenses, bucketNames }) => {
  const spendingByPath = expenses.reduce((accumulatedSpending, entry) => {
    accumulatedSpending[entry.categories_path] =
      (accumulatedSpending[entry.categories_path] || 0) +
      parseFloat(entry.amount);
    return accumulatedSpending;
  }, {});

  return bucketNames.reduce((spending, bucketName) => {
    spending[bucketName] =
      spendingByPath[`,${bucketName.toLowerCase()},`] || 0;
    return spending;
  }, {});
};

/**
 * Returns the chronologically ordered `{ year, month }` pairs that have been
 * recorded, from the earliest one up to (and including) the given date.
 *
 * @param {Object} params
 * @param {Object} params.entries - The nested `entries[year][month]` tree.
 * @param {Object} params.until - `{ year, month }` upper bound (inclusive).
 * @returns {Array<{ year: number, month: number }>}
 */
const getRecordedMonthsUntil = ({ entries, until }) => {
  const recordedMonths = [];
  const years = Object.keys(entries)
    .map(Number)
    .sort((firstYear, secondYear) => firstYear - secondYear);

  for (const year of years) {
    if (year > until.year) break;
    const months = Object.keys(entries[year])
      .map(Number)
      .sort((firstMonth, secondMonth) => firstMonth - secondMonth);
    for (const month of months) {
      if (year === until.year && month > until.month) break;
      recordedMonths.push({ year, month });
    }
  }

  return recordedMonths;
};

/**
 * Computes the carry-on state of every bucket for the selected month.
 *
 * Walking chronologically from the first recorded month up to the selected
 * one, the following recurrence is applied per bucket:
 *
 *   availability = allowance + previousMonthRemainder
 *   remainder    = availability - monthSpending
 *
 * `remainder` becomes the `carryOver` for the next month, which lets the user
 * save unused allowance (positive remainder) or carry debt forward (negative
 * remainder). The walk is a single pass over the recorded months
 * (O(months * buckets)), keeping the calculation efficient.
 *
 * Months before the first recorded month default to a plain allowance with no
 * carry-on, since there is nothing to accumulate yet.
 *
 * @param {Object} params
 * @param {Object} params.entries - The nested `entries[year][month]` tree.
 * @param {Object} params.buckets - `{ [bucketName]: allowance }`.
 * @param {Object} params.selectedDate - `{ year, month }` of the viewed month.
 * @returns {Object} bucketName -> { allowance, carryOver, availability, spending, remainder }
 */
const getCarriedBucketsForMonth = ({ entries, buckets, selectedDate }) => {
  const bucketNames = Object.keys(buckets);
  const recordedMonths = getRecordedMonthsUntil({
    entries,
    until: selectedDate,
  });

  const remainders = bucketNames.reduce((accumulatedRemainders, bucketName) => {
    accumulatedRemainders[bucketName] = 0;
    return accumulatedRemainders;
  }, {});

  const carriedBuckets = bucketNames.reduce((carried, bucketName) => {
    const allowance = buckets[bucketName];
    carried[bucketName] = {
      allowance,
      carryOver: 0,
      availability: allowance,
      spending: 0,
      remainder: allowance,
    };
    return carried;
  }, {});

  for (const { year, month } of recordedMonths) {
    const expenses = entries?.[year]?.[month]?.expenses || [];
    const spendingByBucket = getMonthSpendingByBucket({ expenses, bucketNames });
    const isSelectedMonth =
      year === selectedDate.year && month === selectedDate.month;

    bucketNames.forEach((bucketName) => {
      const allowance = buckets[bucketName];
      const carryOver = remainders[bucketName];
      const availability = allowance + carryOver;
      const spending = spendingByBucket[bucketName];
      const remainder = availability - spending;

      remainders[bucketName] = remainder;

      if (isSelectedMonth) {
        carriedBuckets[bucketName] = {
          allowance,
          carryOver,
          availability,
          spending,
          remainder,
        };
      }
    });

    if (isSelectedMonth) break;
  }

  return carriedBuckets;
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
  getExpenseCategoryNames,
  getCategoryValidationError,
  getCategoriesWithoutBucket,
  getBucketValidationError,
  getGroupedFilledEntriesByDate,
  quantitiesToPercentages,
  getFilteredEntriesByCategory,
  getDatedEntries,
  getCategoryPercentagesFromEntries,
  getCurrentEmptyMonth,
  calculatePercentage,
  getMonthSpendingByBucket,
  getRecordedMonthsUntil,
  getCarriedBucketsForMonth,
};
