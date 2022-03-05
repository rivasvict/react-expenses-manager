import dayjs from "dayjs";
import { getCurrentMonth, getCurrentTimestamp, getCurrentYear } from "../date";
import { calculateTotal } from "../general";
/*
* TODO: The currency $ string here should come from
* a global configuration object of the user settings
* in the db
*/
const currencySymbol = '$';

function getSumFromEntries(entries) {
  const entriesForSum = entries.map(entry => parseFloat(entry.amount));

  return calculateTotal(...entriesForSum);
}

/*
*  TODO: This function probably needs to be separated
*  from the rest of the helpers as the formatting
*  functionalities may become more complex
*/
function formatNumberForDisplay(amount) {
  if (isNaN(amount)) {
    /*
    * TODO: The currency $ string here should come from
    * a global configuration object of the user settings
    * in the db
    */
    return `${0} ${currencySymbol}`;
  } else {
    const numberOfDecimals = 2;
    /*
    * TODO: The currency $ string here should come from
    * a global configuration object of the user settings
    * in the db
    */
    return `${Number.isSafeInteger(parseFloat(amount)) ? amount : parseFloat(amount).toFixed(numberOfDecimals)} ${currencySymbol}`;
  }
}

function getSum({ entryType, entries }) {
  if (entries[entryType]) {
    const entriesByType = getEntries({ entryType, entries });
    return entryType === 'incomes' ? getSumFromEntries(entriesByType) : -getSumFromEntries(entriesByType);
  }
}

function getEntries({ entries, entryType }) {
  return entries[entryType];
}

function getEntryModel({ entryType, timestamp = getCurrentTimestamp() }) {
  return { date: timestamp, amount: '', description: '', type: entryType, categories_path: '' };
}

function getSelectOptionsForDisplay(selectOptions) {
  return selectOptions.map((selectOption) => (
    { name: selectOption, value: selectOption.toLowerCase() }
  ));
};

function getEntryCategoryOption(entryType) {
  // TODO: These categories should live somewhere else
  // in a settings or constant file

  // TODO: These categories should come from the database
  const incomeCategories = [
    'Salary',
    'Deposit',
    'Saving'
  ];

  const expenseCategories = [
    'Food',
    'Alcohol',
    'Clothes',
    'Fixed expenses',
    'Health',
    'House',
    'House insurance',
    'Electricity',
    'Internet',
    'Laundry',
    'Others',
    'Parents',
    'Mobile',
    'Tech',
    'Transport'
  ];

  const categoryOptions = {
    income: getSelectOptionsForDisplay(incomeCategories),
    expense: getSelectOptionsForDisplay(expenseCategories)
  };

  return categoryOptions[entryType];
}

const getEmtpyMonthModel = () => ({
  incomes: [],
  expenses: []
});

const getCurrentEmptyMonth = () => (
  {
    [getCurrentYear()]: {
      [getCurrentMonth()]: getEmtpyMonthModel()
    }
  }
);

// TODO: Refactor this function so it does not have that much
// Responsibility
const getGroupEntriesByDate = () => (entries) => {
  if (entries.length) {
    return (
      entries.reduce((parsedEntries, newEntry) => {
        const newEntryDate = dayjs(newEntry.date);
        const newEntryYear = newEntryDate.year();
        const newEntryMonth = newEntryDate.month();

        const addEntryDateTreeToANewYear = () => parsedEntries[newEntryYear] = { [newEntryMonth]: { [`${newEntry.type}s`]: [newEntry] } };
        const addEntryDateTreeToANewMonth = () => parsedEntries[newEntryYear][newEntryMonth] = { [`${newEntry.type}s`]: [newEntry] };
        const addEntryDateTreeToANewType = () => parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`] = [newEntry];
        const pushTheNewEntryToTheExistingType = () => parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`].push(newEntry);
        // Year not created
        if (!parsedEntries[newEntryYear]) {
          addEntryDateTreeToANewYear();
          // Year created but month not created
        } else if (!parsedEntries[newEntryYear][newEntryMonth]) {
          addEntryDateTreeToANewMonth();
          // Year created and month created but not the entry type
        } else if (parsedEntries[newEntryYear][newEntryMonth] && !parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`]) {
          addEntryDateTreeToANewType();
          // Everything exists
        } else {
          pushTheNewEntryToTheExistingType();
        }

        return parsedEntries;
      }, {})
    );
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
const getEntriesWithFilledDates = () => ({ entries, firstEntryDate }) => {
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
  }

  const fillMonthWithEmptyMonthModel = (currentEntriesYear) => {
    currentEntriesYear[pointerMonth] = getEmtpyMonthModel();
    advanceToTheNextDateIndexes();
  }

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
  }

  const advanceToTheNextDateIndexes = () => {
    pointerMonth++;
    resetMonthCountToJanuaryIndex();
  }

  const resetMonthCountToJanuaryIndex = () => {
    if (pointerMonth > 11) {
      pointerMonth = 0;
      pointerYear++;
    }
  }

  while (pointerYear <= endYear && pointerMonth <= endMonth) {
    const currentEntriesYear = entries[pointerYear];
    if (!currentEntriesYear) {
      fillAYearOfMonthsWithEmptyEntries();
    } else if (!currentEntriesYear[pointerMonth]) {
      fillMonthWithEmptyMonthModel(currentEntriesYear);
    } else if (currentEntriesYear[pointerMonth] && (!currentEntriesYear[pointerMonth].incomes || !currentEntriesYear[pointerMonth].expenses)) {
      fillMonthEntries(currentEntriesYear);
    } else {
      advanceToTheNextDateIndexes();
    }
  }

  return entries;
};

const getGroupedFilledEntriesByDate = () => (entries) => {
  const groupedEntriesByDate = getGroupEntriesByDate()(entries);
  return getEntriesWithFilledDates()({ entries: groupedEntriesByDate, firstEntryDate: entries.length && entries[0].date });
};

export {
  getSumFromEntries,
  formatNumberForDisplay,
  getSum,
  getEntryModel,
  getEntryCategoryOption,
  getGroupedFilledEntriesByDate
}