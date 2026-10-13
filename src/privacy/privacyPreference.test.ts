import {
  getStoredPrivacyMode,
  PRIVACY_MODE_STORAGE_KEY,
  storePrivacyMode,
} from "./privacyPreference";

describe("privacyPreference", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it("is off when nothing is stored", () => {
    expect(getStoredPrivacyMode()).toBe(false);
  });

  it("is on only for the exact stored value", () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    expect(getStoredPrivacyMode()).toBe(true);

    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "true");
    expect(getStoredPrivacyMode()).toBe(false);
  });

  it("stores on, and clears the key when turned off", () => {
    storePrivacyMode(true);
    expect(getStoredPrivacyMode()).toBe(true);

    storePrivacyMode(false);
    expect(getStoredPrivacyMode()).toBe(false);
    expect(localStorage.getItem(PRIVACY_MODE_STORAGE_KEY)).toBeNull();
  });

  it("falls back to off when storage cannot be read", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getStoredPrivacyMode()).toBe(false);
  });

  it("does not throw when storage cannot be written", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => storePrivacyMode(true)).not.toThrow();
  });
});
