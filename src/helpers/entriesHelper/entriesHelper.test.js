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
