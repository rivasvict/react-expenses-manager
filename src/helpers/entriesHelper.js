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

export {
  getSumFromEntries,
  getSum,
  getEntryModel,
  getEntryCategoryOption 
}