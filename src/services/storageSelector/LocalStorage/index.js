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
  editEntry: ({ entryId, entry }) => {
    const balance = getBalanceFromLocalStorage();
    const newBalance = balance.map((originalEntry) => {
      if (originalEntry.id === entryId) {
        return entry;
      }
      return originalEntry;
    });
    debugger;
    storeBalance(newBalance);
  },
});

export default LocalStorage;
