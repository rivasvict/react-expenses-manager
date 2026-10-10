import { formatSavings, formatSignedSavings } from "./formatters";

describe("formatSavings", () => {
  it("formats dollars with two decimals", () => {
    expect(formatSavings(1620)).toBe("$1,620.00");
    expect(formatSavings(0)).toBe("$0.00");
  });

  it("uses a true minus for a negative amount", () => {
    expect(formatSavings(-180)).toBe("−$180.00");
  });

  it("does not show a minus for an amount that rounds to zero", () => {
    expect(formatSavings(-0.001)).toBe("$0.00");
  });
});

describe("formatSignedSavings", () => {
  it("adds a plus only to a gain", () => {
    expect(formatSignedSavings(340)).toBe("+$340.00");
    expect(formatSignedSavings(-380)).toBe("−$380.00");
    expect(formatSignedSavings(0)).toBe("$0.00");
  });
});
