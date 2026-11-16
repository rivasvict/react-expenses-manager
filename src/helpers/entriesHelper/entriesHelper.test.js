const balanceResponse = require("./balance-response.json");
const grouppedFilledEntriesByDate = require("./grouppedFilledEntriesByDate.json");
const {
  getGroupedFilledEntriesByDate,
  getExpenseSavingsPercentages,
} = require("./entriesHelper");

describe("Entries helper", () => {
  it("getGroupedFilledEntriesByDate: Should return the dates grouped by date and with no empty dates", () => {
    jest.useFakeTimers({ advanceTimers: false });
    jest.setSystemTime(new Date("2021-04-10T00:00:00.000Z"));

    const processedEntries = getGroupedFilledEntriesByDate()(balanceResponse);

    jest.useRealTimers();
    expect(processedEntries).toStrictEqual(grouppedFilledEntriesByDate);
  });

  describe("getExpenseSavingsPercentages", () => {
    it("should use incomes as the 100% base", () => {
      expect(getExpenseSavingsPercentages(1000, 250)).toStrictEqual([25, 75]);
    });

    it("should split evenly when expenses are half of incomes", () => {
      expect(getExpenseSavingsPercentages(1000, 500)).toStrictEqual([50, 50]);
    });

    it("should compute the correct split for a non-round percentage", () => {
      expect(getExpenseSavingsPercentages(1000, 300)).toStrictEqual([30, 70]);
    });

    it("should return 100% savings when there are no expenses", () => {
      expect(getExpenseSavingsPercentages(1000, 0)).toStrictEqual([0, 100]);
    });

    it("should cap at 100% expenses / 0% savings when overspending", () => {
      expect(getExpenseSavingsPercentages(500, 750)).toStrictEqual([100, 0]);
    });

    it("should cap at 100% expenses / 0% savings when expenses equal incomes", () => {
      expect(getExpenseSavingsPercentages(500, 500)).toStrictEqual([100, 0]);
    });

    it("should cap at 100% expenses / 0% savings when incomes are zero but there are expenses", () => {
      expect(getExpenseSavingsPercentages(0, 200)).toStrictEqual([100, 0]);
    });

    it("should return 0% expenses / 0% savings when both incomes and expenses are zero", () => {
      expect(getExpenseSavingsPercentages(0, 0)).toStrictEqual([0, 0]);
    });
  });
});

describe("getBucketConsumptionPercentage", () => {
  const { getBucketConsumptionPercentage } = require("./entriesHelper");

  it("is spending over what is available", () => {
    expect(
      getBucketConsumptionPercentage({ allowance: 300, availability: 256.63, spending: 171.83 })
    ).toBeCloseTo(66.96, 2);
  });

  it("counts carried debt as consumption once nothing is available", () => {
    // Available -50 of a 100 allowance, 20 spent: 100 + (20 + 50) / 100.
    expect(
      getBucketConsumptionPercentage({ allowance: 100, availability: -50, spending: 20 })
    ).toBe(170);
  });
});

describe("bucket start month", () => {
  const {
    getActiveLimitForMonth,
    isBucketActiveInMonth,
    getCarriedBucketsForMonth,
  } = require("./entriesHelper");
  // Created in March 2026, raised in May.
  const gym = [
    { from: "2026-03", limit: 100 },
    { from: "2026-05", limit: 150 },
  ];

  it("a bucket exists from its first month on, never before", () => {
    expect(isBucketActiveInMonth(gym, "2026-02")).toBe(false);
    expect(isBucketActiveInMonth(gym, "2026-03")).toBe(true);
    expect(isBucketActiveInMonth(gym, "2026-06")).toBe(true);
  });

  it("old-format and from-the-beginning buckets exist in every month", () => {
    expect(isBucketActiveInMonth(200, "1990-01")).toBe(true);
    expect(isBucketActiveInMonth([{ from: "0000-00", limit: 200 }], "1990-01")).toBe(true);
  });

  it("has no limit before the bucket was created", () => {
    expect(getActiveLimitForMonth(gym, "2026-02")).toBe(0);
    expect(getActiveLimitForMonth(gym, "2026-04")).toBe(100);
    expect(getActiveLimitForMonth(gym, "2026-05")).toBe(150);
  });

  it("carries nothing from the months before the bucket was created", () => {
    const expense = (amount) => ({ amount, categories_path: ",gym," });
    const entries = {
      2026: {
        0: { incomes: [], expenses: [expense("40")] },
        1: { incomes: [], expenses: [expense("60")] },
        2: { incomes: [], expenses: [expense("30")] },
        3: { incomes: [], expenses: [] },
      },
    };
    const carried = (month) =>
      getCarriedBucketsForMonth({
        entries,
        buckets: { Gym: gym },
        selectedDate: { year: 2026, month },
      }).Gym;

    // February, before the bucket: no allowance, nothing tracked.
    expect(carried(1)).toMatchObject({ allowance: 0, carryOver: 0, spending: 0 });
    // March, its first month: January and February spending is not debt.
    expect(carried(2)).toEqual({
      allowance: 100,
      carryOver: 0,
      availability: 100,
      spending: 30,
      remainder: 70,
    });
    // April carries March's remainder only.
    expect(carried(3)).toMatchObject({ carryOver: 70, availability: 170 });
  });
});
