const balanceResponse = require("./balance-response.json");
const grouppedFilledEntriesByDate = require("./grouppedFilledEntriesByDate.json");
const { getGroupedFilledEntriesByDate } = require("./entriesHelper");

describe("Entries helper", () => {
  it("getGroupedFilledEntriesByDate: Should return the dates grouped by date and with no empty dates", () => {
    jest.useFakeTimers({ advanceTimers: false });
    jest.setSystemTime(new Date("2021-04-10T00:00:00.000Z"));

    const processedEntries = getGroupedFilledEntriesByDate()(balanceResponse);

    jest.useRealTimers();
    expect(processedEntries).toStrictEqual(grouppedFilledEntriesByDate);
  });
});
