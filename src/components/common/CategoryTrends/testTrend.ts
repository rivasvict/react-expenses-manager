import { getCategoryTrend } from "../../../helpers/categoryTrends/categoryTrends";
import type { CategoryType } from "../../../helpers/categoryLists/categoryLists";

// April to October 2026 for one category, for the components' tests.
export const makeTrend = (type: CategoryType, name: string, amounts: number[]) => {
  const key = type === "income" ? "incomes" : "expenses";
  const months = Object.fromEntries(
    amounts.map((amount, i) => [
      3 + i,
      { [key]: amount ? [{ amount: String(amount), type, categories_path: `,${name.toLowerCase()},` }] : [] },
    ])
  );
  return getCategoryTrend({ 2026: months }, type, name, { year: 2026, month: 3 + amounts.length - 1 }, amounts.length - 1);
};
