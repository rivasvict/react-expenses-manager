import { v4 as uuidv4 } from "uuid";
const BALANCE = "balance";

const getBalanceFromLocalStorage = () => {
  const storedBalance = localStorage.getItem(BALANCE) || "";
  return storedBalance ? JSON.parse(storedBalance) : [];
};

const LocalStorage = () => ({
  getBalance: () => getBalanceFromLocalStorage(),
  setRecord: (entry) => {
    if (!entry) throw new Error("No entry was added");
    const balance = getBalanceFromLocalStorage();
    const newBalance = [...balance, { ...entry, id: uuidv4() }];
    localStorage.setItem(BALANCE, JSON.stringify(newBalance));
  },
  getEntryById: (entryId) => {
    const balance = getBalanceFromLocalStorage();
    const entry = balance.find(
      (entryFromBalance) => entryFromBalance.id === entryId
    );
    if (!entry) return null;
    return entry;
  },
});

export default LocalStorage;
