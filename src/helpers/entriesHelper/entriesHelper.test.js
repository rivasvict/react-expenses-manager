const balanceResponse = require("./balance-response.json");
const grouppedFilledEntriesByDate = require("./grouppedFilledEntriesByDate.json");
const { getGroupedFilledEntriesByDate } = require("./entriesHelper");

describe("Entries helper", () => {
  it.only("getGroupedFilledEntriesByDate: Should return the dates grouped by date and with no empty dates", () => {
    const processedEntries = getGroupedFilledEntriesByDate()(balanceResponse);
    expect(processedEntries).toStrictEqual(grouppedFilledEntriesByDate);
  });
});
