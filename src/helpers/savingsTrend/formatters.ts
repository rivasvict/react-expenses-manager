import { formatNumberForDisplay } from "../entriesHelper/entriesHelper";

const MINUS = "−";

/** "$1,620.00", with a true minus for a negative amount: "−$180.00". */
export const formatSavings = (amount: number) => {
  const formatted = formatNumberForDisplay(Math.abs(amount));
  return amount < 0 && Math.abs(amount) >= 0.005 ? `${MINUS}${formatted}` : formatted;
};

/** Like `formatSavings` but a gain carries a plus: "+$340.00". */
export const formatSignedSavings = (amount: number) =>
  amount > 0 ? `+${formatSavings(amount)}` : formatSavings(amount);
