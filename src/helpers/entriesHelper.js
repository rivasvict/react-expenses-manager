import dayjs from "dayjs";
import { calculateTotal } from "./general";

function getSumFromEntries(entries) {
  const entriesForSum = entries.map(entry => parseInt(entry.amount));
  return calculateTotal(...entriesForSum);
}

function getSum({ entryType, entries }) {
  if (entries[entryType]) {
    const entriesByType = getEntries({ entryType, entries });
    return entryType === 'incomes' ? getSumFromEntries(entriesByType) : -getSumFromEntries(entriesByType);
  }
}

function getEntries({ entries, entryType}) {
   return entries[entryType];
}

function getEntryModel(entryType) {
  const timestamp = dayjs().unix() * 1000;
  return { date: timestamp, amount: '', description: '', type: entryType, categories_path: '' };
}

function getEntryCategoryOption(entryType) {
  const categoryOptions = {
    expense: [
      { name: 'Food', value: 'food' },
      { name: 'House', value: 'house' }
    ],
    income: [
      { name: 'Salary', value: 'salary' },
      { name: 'Loan', value: 'loan' }
    ]
  };
  
  return categoryOptions[entryType];
}

const getGroupEntriesByDate = () => (entries) => {
  let entriesToSetInState = entries;

  if (entries.length) {
    return (
      entries.reduce((parsedEntries, newEntry) => {
        const newEntryDate = dayjs(newEntry.date);
        const newEntryYear = newEntryDate.year();
        const newEntryMonth = newEntryDate.month();

        // Year not created
        if (!parsedEntries[newEntryYear]) {
          parsedEntries[newEntryYear] = { [newEntryMonth]: { [`${newEntry.type}s`]: [newEntry] } };
        // Year created but month not created
        } else if (parsedEntries[newEntryYear] && !parsedEntries[newEntryYear][newEntryMonth]) {
          parsedEntries[newEntryYear][newEntryMonth] = { [`${newEntry.type}s`]: [newEntry] };
        // Year created and month created but not the entry type
        } else if (parsedEntries[newEntryYear] && parsedEntries[newEntryYear][newEntryMonth] && !parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`]) {
          parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`] = [newEntry];
        // Everything exists
        } else {
          parsedEntries[newEntryYear][newEntryMonth][`${newEntry.type}s`].push(newEntry);
        }

        return parsedEntries;
      }, {})
    );
  }

  return entriesToSetInState;
};

const getEmtpyMonthModel = () => ({
  incomes: [],
  expenses: []
});

const fillYear = ({ entries, pointerYear }) => {
  for (let i = 0; i <= 11; i++) {
    if (!entries[pointerYear]) {
      entries[pointerYear] = { [i]: getEmtpyMonthModel() };
    } else {
      entries[pointerYear][i] = getEmtpyMonthModel();
    }
  }
};

const getEntriesWithFilledDates = () => ({ entries, firstEntryDate }) => {
  const pointerDate = dayjs(firstEntryDate);
  let pointerYear = pointerDate.year();
  let pointerMonth = pointerDate.month();
  const endDate = dayjs();
  const endYear = endDate.year();
  const endMonth = endDate.month();

  while (pointerYear <= endYear && pointerMonth <= endMonth) {
    if (!entries[pointerYear]) {
      fillYear({ entries, pointerYear })
      pointerMonth = 0;
      pointerYear++;
    } else if (entries[pointerYear] && !entries[pointerYear][pointerMonth]) {
      entries[pointerYear][pointerMonth] = getEmtpyMonthModel();
      pointerMonth++;
      if (pointerMonth > 11) {
        pointerMonth = 0;
        pointerYear++;
      }
    } else if (entries[pointerYear] && entries[pointerYear][pointerMonth] && (!entries[pointerYear][pointerMonth].incomes || !entries[pointerYear][pointerMonth].expenses)) {
      const entryMonthContent = entries[pointerYear][pointerMonth];
      if (!entryMonthContent.incomes) {
        entries[pointerYear][pointerMonth].incomes = [];
      }
      if (!entryMonthContent.expenses) {
        entries[pointerYear][pointerMonth].expenses = [];
      }
      pointerMonth++;
      if (pointerMonth > 11) {
        pointerMonth = 0;
        pointerYear++;
      }
    } else {
      pointerMonth++;
      if (pointerMonth > 11) {
        pointerMonth = 0;
        pointerYear++;
      }
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
  getSum,
  getEntryModel,
  getEntryCategoryOption,
  getGroupedFilledEntriesByDate
}