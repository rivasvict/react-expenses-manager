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
