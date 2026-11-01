import {
  applyThemeArt,
  getStoredThemeArt,
  storeThemeArt,
  THEME_ART_STORAGE_KEY,
} from "./artPreference";

describe("artPreference", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.themeArt;
  });

  it("is on when nothing is stored", () => {
    expect(getStoredThemeArt()).toBe(true);
  });

  it("round-trips off and on", () => {
    storeThemeArt(false);
    expect(localStorage.getItem(THEME_ART_STORAGE_KEY)).toBe("off");
    expect(getStoredThemeArt()).toBe(false);
    storeThemeArt(true);
    expect(getStoredThemeArt()).toBe(true);
  });

  it("stays on when storage cannot be read or written", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getStoredThemeArt()).toBe(true);
    spy.mockRestore();
    const set = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => storeThemeArt(false)).not.toThrow();
    set.mockRestore();
  });

  it("marks <html> only when the pictures are off", () => {
    applyThemeArt(false);
    expect(document.documentElement.dataset.themeArt).toBe("off");
    applyThemeArt(true);
    expect(document.documentElement.dataset.themeArt).toBeUndefined();
  });
});
