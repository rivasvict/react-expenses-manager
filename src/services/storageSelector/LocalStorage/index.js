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
    const newBalance = [...balance, entry];
    localStorage.setItem(BALANCE, JSON.stringify(newBalance));
  },
});

export default LocalStorage;
