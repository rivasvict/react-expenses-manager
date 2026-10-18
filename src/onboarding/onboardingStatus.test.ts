import {
  isNewUser,
  isOnboardingCompleted,
  markOnboardingCompleted,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from "./onboardingStatus";

describe("onboardingStatus", () => {
  beforeEach(() => localStorage.clear());

  it("treats an empty device as a new user", () => {
    expect(isNewUser()).toBe(true);
    expect(isOnboardingCompleted()).toBe(false);
  });

  it.each([
    ["entries", "balance", JSON.stringify([{ id: "1" }])],
    ["a bucket", "buckets", JSON.stringify({ Food: [{ from: "0000-00", limit: 5 }] })],
    ["a recurring entry", "fixedEntries", JSON.stringify([{ id: "f1" }])],
    ["category lists", "categoryLists", JSON.stringify({ expense: [], income: [] })],
  ])("is not a new user once the device holds %s", (_label, key, value) => {
    localStorage.setItem(key, value);
    expect(isNewUser()).toBe(false);
  });

  it("ignores empty stored lists and objects", () => {
    localStorage.setItem("balance", "[]");
    localStorage.setItem("buckets", "{}");
    expect(isNewUser()).toBe(true);
  });

  it("is not a new user after finishing or skipping once", () => {
    markOnboardingCompleted();
    expect(localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY)).toBe("1");
    expect(isOnboardingCompleted()).toBe(true);
    expect(isNewUser()).toBe(false);
  });
});
