import { calculateTotal } from "./general";

function getSumFromEntries(entries) {
  const entriesForSum = entries.map(entry => parseInt(entry.ammount));
  return calculateTotal(...entriesForSum);
}

function getSum({ entryType, entries }) {
  if (entries[entryType]) {
    const entriesByType = getEntries({ entryType, entries });
    return getSumFromEntries(entriesByType);
  }
}

function getEntries({ entries, entryType}) {
   return entries[entryType];
}

function getEntryModel(entryType) {
  return { ammount: '', description: '', type: entryType, category: '' };
}

function getEntryCategoryOption(entryType) {
  const categoryOptions = {
    outcome: [
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