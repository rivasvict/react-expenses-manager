import {
  CURRENCY_STORAGE_KEY,
  formatCurrency,
  getCurrencySymbol,
  getStoredCurrency,
  storeCurrency,
} from "./currency";

describe("currency", () => {
  beforeEach(() => localStorage.clear());

  describe("preference", () => {
    it("defaults to US Dollar when nothing is stored", () => {
      expect(getStoredCurrency()).toBe("USD");
      expect(getCurrencySymbol()).toBe("$");
    });

    it("round-trips a supported currency through localStorage", () => {
      storeCurrency("EUR");
      expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe("EUR");
      expect(getStoredCurrency()).toBe("EUR");
    });

    it("falls back to US Dollar for an unsupported stored value", () => {
      localStorage.setItem(CURRENCY_STORAGE_KEY, "XYZ");
      expect(getStoredCurrency()).toBe("USD");
    });

    it("falls back to US Dollar when storage cannot be read", () => {
      const getItem = jest
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("blocked");
        });
      expect(getStoredCurrency()).toBe("USD");
      getItem.mockRestore();
    });

    it("does not throw when storage cannot be written", () => {
      const setItem = jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("blocked");
        });
      expect(() => storeCurrency("EUR")).not.toThrow();
      setItem.mockRestore();
    });
  });

  describe("formatCurrency", () => {
    it("formats in US Dollar by default", () => {
      expect(formatCurrency(1620)).toBe("$1,620.00");
      expect(formatCurrency(-50)).toBe("-$50.00");
      expect(formatCurrency("75")).toBe("$75.00");
    });

    it("reads a non-numeric amount as zero", () => {
      expect(formatCurrency("abc")).toBe("$0.00");
      expect(formatCurrency(NaN)).toBe("$0.00");
    });

    it("uses the stored currency's own symbol", () => {
      storeCurrency("EUR");
      expect(formatCurrency(1620)).toBe("€1,620.00");
      storeCurrency("GBP");
      expect(formatCurrency(-50)).toBe("-£50.00");
    });

    it("tells the dollars and pesos apart", () => {
      expect(formatCurrency(10, "CAD")).toBe("CA$10.00");
      expect(formatCurrency(10, "MXN")).toBe("MX$10.00");
      // The decimals come from the runtime's CLDR data, which gives COP two
      // up to CLDR 47 and none from CLDR 48 (Node 26); only the symbol is
      // ours.
      expect(formatCurrency(10, "COP")).toMatch(/^COL\$10(\.00)?$/);
    });

    it("drops the decimals for currencies that have none", () => {
      expect(formatCurrency(1234.5, "JPY")).toBe("¥1,235");
      expect(formatCurrency(1234.4, "CLP")).toBe("CLP$1,234");
    });
  });
});
