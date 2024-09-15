import { v4 as uuidv4 } from "uuid";
const BALANCE = "balance";

const getBalanceFromLocalStorage = () => {
  const storedBalance = localStorage.getItem(BALANCE) || "";
  return storedBalance ? JSON.parse(storedBalance) : [];
};
const storeBalance = (balance) =>
  localStorage.setItem(BALANCE, JSON.stringify(balance));

const LocalStorage = () => ({
  getBalance: () => getBalanceFromLocalStorage(),
  setBalance: ({ balance }) => storeBalance(balance),
  clearAllData: () => localStorage.clear(),
  setNewRecord: (entry) => {
    if (!entry) throw new Error("No entry was added");
    const balance = getBalanceFromLocalStorage();
    const newBalance = [...balance, { ...entry, id: uuidv4() }];
    storeBalance(newBalance);
  },
  getEntryById: (entryId) => {
    const balance = getBalanceFromLocalStorage();
    const entry = balance.find(
      (entryFromBalance) => entryFromBalance.id === entryId
    );
    if (!entry) return null;
    return entry;
  },
  editEntry: ({ entry }) => {
    const balance = getBalanceFromLocalStorage();
    const newBalance = balance.map((originalEntry) => {
      if (originalEntry.id === entry.id) {
        return entry;
      }
      return originalEntry;
    });
    storeBalance(newBalance);
    return newBalance;
  },
  removeEntry: ({ entryId }) => {
    const balance = getBalanceFromLocalStorage();
    const newBalance = balance.filter(
      (originalEntry) => originalEntry.id !== entryId
    );
    storeBalance(newBalance);
    return newBalance;
  },
});

export default LocalStorage;
