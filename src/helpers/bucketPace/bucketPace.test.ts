import { getBucketWeeks, getElapsedDays, getExpectedSpending } from "./bucketPace";

const OCTOBER = { year: 2026, month: 9 };
const at = (day: number, month = 9) => new Date(2026, month, day, 12).getTime();
const today = (day: number, month = 9) => new Date(2026, month, day, 9);

describe("getElapsedDays", () => {
  it("is today's day for the current month, all of a past month, none of a future one", () => {
    expect(getElapsedDays({ selectedDate: OCTOBER, today: today(28) })).toBe(28);
    expect(getElapsedDays({ selectedDate: OCTOBER, today: today(3, 10) })).toBe(31);
    expect(getElapsedDays({ selectedDate: OCTOBER, today: today(20, 8) })).toBe(0);
  });
});

describe("getExpectedSpending", () => {
  it("spreads what is available evenly over the month", () => {
    const expected = getExpectedSpending({ availability: 256.63, selectedDate: OCTOBER, today: today(28) });
    expect(expected).toBeCloseTo(231.79, 2);
  });

  it("has no pace without anything available, or in a future month", () => {
    expect(getExpectedSpending({ availability: 0, selectedDate: OCTOBER, today: today(28) })).toBeNull();
    expect(getExpectedSpending({ availability: -5, selectedDate: OCTOBER, today: today(28) })).toBeNull();
    expect(getExpectedSpending({ availability: 100, selectedDate: OCTOBER, today: today(20, 8) })).toBeNull();
  });

  it("uses the whole month for a past month", () => {
    expect(getExpectedSpending({ availability: 100, selectedDate: OCTOBER, today: today(3, 10) })).toBe(100);
  });
});

describe("getBucketWeeks", () => {
  const expenses = [
    { id: "a", amount: "36.00", date: at(5) },
    { id: "b", amount: "47.68", date: at(12) },
    { id: "c", amount: "8.75", date: at(19) },
    { id: "d", amount: "36.90", date: at(24) },
    { id: "e", amount: "42.50", date: at(28) },
  ];
  const weeks = getBucketWeeks({ expenses, availability: 256.63, selectedDate: OCTOBER, today: today(28) });

  it("groups Monday to Sunday weeks, newest first, skipping weeks without expenses", () => {
    expect(weeks.map(({ startDay, endDay }) => [startDay, endDay])).toEqual([
      [26, 28],
      [19, 25],
      [12, 18],
      [5, 11],
    ]);
  });

  it("totals each week and keeps its expenses newest first", () => {
    expect(weeks[1].spent).toBeCloseTo(45.65, 2);
    expect(weeks[1].expenses.map(({ id }) => id)).toEqual(["d", "c"]);
  });

  it("gives each week the pace of the days it covers, so a partial week is lower", () => {
    expect(weeks[0].pace).toBeCloseTo(24.84, 2);
    expect(weeks[1].pace).toBeCloseTo(57.95, 2);
  });

  it("clips the first week to the start of the month", () => {
    const [week] = getBucketWeeks({
      expenses: [{ amount: "10", date: at(2) }],
      availability: 310,
      selectedDate: OCTOBER,
      today: today(3, 10),
    });
    expect([week.startDay, week.endDay]).toEqual([1, 4]);
    expect(week.pace).toBeCloseTo(40, 5);
  });

  it("has no pace when nothing is available", () => {
    const noPace = getBucketWeeks({ expenses, availability: -10, selectedDate: OCTOBER, today: today(28) });
    expect(noPace.every(({ pace }) => pace === null)).toBe(true);
  });

  it("keeps an expense dated after today in its own week", () => {
    const [week] = getBucketWeeks({
      expenses: [{ amount: "5", date: at(30) }],
      availability: 310,
      selectedDate: OCTOBER,
      today: today(28),
    });
    expect([week.startDay, week.endDay]).toEqual([26, 30]);
  });
});
