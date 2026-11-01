import {
  applyStoredTheme,
  applyTheme,
  DEFAULT_THEME_ID,
  getStoredThemeId,
  getTheme,
  isThemeId,
  storeThemeId,
  THEME_CATALOG,
  THEME_STORAGE_KEY,
} from "./themePreference";

describe("themePreference", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
  });
  afterEach(() => jest.restoreAllMocks());

  it("lists the default theme first", () => {
    expect(THEME_CATALOG[0].id).toBe(DEFAULT_THEME_ID);
    expect(THEME_CATALOG).toHaveLength(15);
  });

  it("uses the default when nothing is stored", () => {
    expect(getStoredThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it("uses the default when the stored id is unknown", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "not-a-theme");
    expect(getStoredThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it("uses the default when storage cannot be read", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getStoredThemeId()).toBe(DEFAULT_THEME_ID);
  });

  it("round-trips a stored theme id", () => {
    storeThemeId("nord");
    expect(getStoredThemeId()).toBe("nord");
  });

  it("survives storage that cannot be written", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => storeThemeId("nord")).not.toThrow();
  });

  it("recognises catalog ids only", () => {
    expect(isThemeId("nord")).toBe(true);
    expect(isThemeId("nope")).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it("finds a theme by id and falls back to the default", () => {
    expect(getTheme("nord").name).toBe("Nord");
    expect(getTheme("nope").id).toBe(DEFAULT_THEME_ID);
  });

  it("applies a theme to <html> and the theme-color meta", () => {
    const theme = getTheme("snowglobe");
    applyTheme(theme);
    expect(document.documentElement.dataset.theme).toBe("snowglobe");
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute("content")
    ).toBe(theme.color["bg-page"]);
  });

  it("applies without a theme-color meta in the page", () => {
    document.head.innerHTML = "";
    expect(() => applyTheme(getTheme("nord"))).not.toThrow();
  });

  it("applies the stored theme", () => {
    storeThemeId("gruvbox");
    applyStoredTheme();
    expect(document.documentElement.dataset.theme).toBe("gruvbox");
  });
});
