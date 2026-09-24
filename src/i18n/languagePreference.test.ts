import {
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
  storeLanguage,
} from "./languagePreference";

describe("languagePreference", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to English when nothing is stored", () => {
    expect(getStoredLanguage()).toBe("en");
  });

  it("round-trips a supported language through localStorage", () => {
    storeLanguage("es");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
    expect(getStoredLanguage()).toBe("es");
  });

  it("falls back to English for an unsupported stored value", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr");
    expect(getStoredLanguage()).toBe("en");
  });

  it("falls back to English when storage cannot be read", () => {
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(getStoredLanguage()).toBe("en");
    getItem.mockRestore();
  });

  it("does not throw when storage cannot be written", () => {
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(() => storeLanguage("es")).not.toThrow();
    setItem.mockRestore();
  });
});
