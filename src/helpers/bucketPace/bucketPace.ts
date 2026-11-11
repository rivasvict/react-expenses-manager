// How a bucket stands against an even spending pace, and its expenses grouped
// by week (design/features/bucket-expenses/ui/decision.md, "Pace rule").

export interface SelectedMonth {
  year: number;
  /** 0-indexed, as in `expensesManager.selectedDate`. */
  month: number;
}

export interface PaceExpense {
  amount: string | number;
  /** Unix timestamp in milliseconds. */
  date: number;
}

/** An expense as the bucket screen lists it. */
export interface BucketExpense extends PaceExpense {
  id: string;
  description?: string;
}

export interface BucketWeek<E extends PaceExpense> {
  /** First and last day of the month the week covers (Monday to Sunday, clipped to the month and to today). */
  startDay: number;
  endDay: number;
  spent: number;
  /** What an even pace allows for these days; null when there is no pace. */
  pace: number | null;
  /** Newest first. */
  expenses: E[];
}

interface PaceInput {
  availability: number;
  selectedDate: SelectedMonth;
  today: Date;
}

const getDaysInMonth = ({ year, month }: SelectedMonth): number =>
  new Date(year, month + 1, 0).getDate();

/**
 * The last day of the viewed month that has "happened": today for the current
 * month, the whole month for a past one, none for a future one.
 */
const getElapsedDays = ({
  selectedDate,
  today,
}: Pick<PaceInput, "selectedDate" | "today">): number => {
  const viewed = selectedDate.year * 12 + selectedDate.month;
  const current = today.getFullYear() * 12 + today.getMonth();
  if (viewed > current) return 0;
  if (viewed < current) return getDaysInMonth(selectedDate);
  return today.getDate();
};

const hasPace = ({ availability, selectedDate, today }: PaceInput): boolean =>
  availability > 0 && getElapsedDays({ selectedDate, today }) > 0;

/** What an even spread of `availability` over the month allows by now, or null when no pace applies. */
const getExpectedSpending = (input: PaceInput): number | null =>
  hasPace(input)
    ? (input.availability * getElapsedDays(input)) / getDaysInMonth(input.selectedDate)
    : null;

/**
 * Groups a month's expenses by week (Monday to Sunday, clipped to the month
 * and to today), newest week first, each with its total and its pace.
 */
const getBucketWeeks = <E extends PaceExpense>({
  expenses,
  availability,
  selectedDate,
  today,
}: PaceInput & { expenses: E[] }): BucketWeek<E>[] => {
  const daysInMonth = getDaysInMonth(selectedDate);
  const elapsed = getElapsedDays({ selectedDate, today });
  const paced = hasPace({ availability, selectedDate, today });
  const weeks = new Map<number, BucketWeek<E> & { lastExpenseDay: number; fullEnd: number }>();

  expenses.forEach((expense) => {
    const day = new Date(expense.date).getDate();
    const sinceMonday =
      (new Date(selectedDate.year, selectedDate.month, day).getDay() + 6) % 7;
    const startDay = Math.max(1, day - sinceMonday);
    const week = weeks.get(startDay) ?? {
      startDay,
      endDay: startDay,
      spent: 0,
      pace: null,
      expenses: [],
      lastExpenseDay: day,
      fullEnd: Math.min(daysInMonth, day - sinceMonday + 6),
    };
    week.spent += parseFloat(String(expense.amount));
    week.lastExpenseDay = Math.max(week.lastExpenseDay, day);
    week.expenses.push(expense);
    weeks.set(startDay, week);
  });

  return [...weeks.values()]
    .map(({ lastExpenseDay, fullEnd, ...week }) => {
      // An expense dated after today still belongs to its week.
      const endDay = Math.min(fullEnd, Math.max(elapsed, lastExpenseDay));
      return {
        ...week,
        endDay,
        pace: paced ? (availability * (endDay - week.startDay + 1)) / daysInMonth : null,
        expenses: [...week.expenses].sort((a, b) => b.date - a.date),
      };
    })
    .sort((a, b) => b.startDay - a.startDay);
};

export { getBucketWeeks, getElapsedDays, getExpectedSpending };
