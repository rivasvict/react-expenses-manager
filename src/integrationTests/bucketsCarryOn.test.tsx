import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  seedEntries,
  ts,
  JANUARY,
  FEBRUARY,
  MARCH,
  APRIL,
  MAY,
  DECEMBER,
} from "./helpers/seed";

// Pinned to May 2026 so the filled month tree spans December 2025 -> May 2026
// (the range used in issue #97's worked example).
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  // Two buckets matching the issue table: Food (200) and Eating out (300).
  localStorage.setItem(
    "buckets",
    JSON.stringify({ Food: 200, "Eating out": 300 })
  );
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// Monthly spending reproduced verbatim from issue #97's worked example.
// Food allowance = 200, Eating out allowance = 300.
function seedIssueExample() {
  seedEntries([
    // December 2025
    { date: ts(2025, DECEMBER), amount: "200", type: "expense", categories_path: ",food," },
    { date: ts(2025, DECEMBER), amount: "300", type: "expense", categories_path: ",eating out," },
    // January 2026
    { date: ts(2026, JANUARY), amount: "150", type: "expense", categories_path: ",food," },
    { date: ts(2026, JANUARY), amount: "150", type: "expense", categories_path: ",eating out," },
    // February 2026
    { date: ts(2026, FEBRUARY), amount: "20", type: "expense", categories_path: ",food," },
    { date: ts(2026, FEBRUARY), amount: "20", type: "expense", categories_path: ",eating out," },
    // March 2026
    { date: ts(2026, MARCH), amount: "420", type: "expense", categories_path: ",food," },
    { date: ts(2026, MARCH), amount: "420", type: "expense", categories_path: ",eating out," },
    // April 2026
    { date: ts(2026, APRIL), amount: "210", type: "expense", categories_path: ",food," },
    { date: ts(2026, APRIL), amount: "210", type: "expense", categories_path: ",eating out," },
    // May 2026
    { date: ts(2026, MAY), amount: "210", type: "expense", categories_path: ",food," },
    { date: ts(2026, MAY), amount: "210", type: "expense", categories_path: ",eating out," },
  ]);
}

async function goToPrevMonth(
  user: Awaited<ReturnType<typeof renderApp>>["user"],
  expectedTitle: string
) {
  await user.click(await screen.findByRole("button", { name: /prev/i }));
  await screen.findByText(expectedTitle);
}

function bucketCarryOver(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-carry-over`).textContent as string;
}
function bucketAvailability(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-availability`).textContent as string;
}
function bucketSpending(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-spending`).textContent as string;
}

describe("buckets carry-on (issue #97)", () => {
  it("shows allowance only on the first recorded month (no carry-over yet)", async () => {
    seedIssueExample();
    const { user } = await renderApp("/buckets");

    // December 2025 is the first recorded month; walk back from May 2026.
    await screen.findByText("May 2026");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await goToPrevMonth(user, "February 2026");
    await goToPrevMonth(user, "January 2026");
    await goToPrevMonth(user, "December 2025");

    // Food: availability (200 + 0) = 200, spend 200 -> remainder 0
    expect(bucketAvailability("bucket-food")).toBe("$200.00");
    expect(bucketSpending("bucket-food")).toBe("$200.00");
    expect(bucketCarryOver("bucket-food")).toBe(
      "Allowance $200.00 + carried $0.00"
    );

    // Eating out: availability (300 + 0) = 300, spend 300 -> remainder 0
    expect(bucketAvailability("bucket-eating-out")).toBe("$300.00");
    expect(bucketSpending("bucket-eating-out")).toBe("$300.00");

    // Percentage is spending vs. carried availability (200 / 200 = 100%).
    expect(screen.getByTestId("bucket-food-percentage").textContent).toBe("100%");

    // The standalone remaining line has been removed.
    expect(screen.queryByTestId("bucket-food-remaining")).toBeNull();
  });

  it("accumulates a positive remainder into the next month's availability", async () => {
    seedIssueExample();
    const { user } = await renderApp("/buckets");

    // February 2026
    await screen.findByText("May 2026");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await goToPrevMonth(user, "February 2026");

    // Food: carry 50, availability (200 + 50) = 250, spend 20 (remainder 230)
    expect(bucketCarryOver("bucket-food")).toBe(
      "Allowance $200.00 + carried $50.00"
    );
    expect(bucketAvailability("bucket-food")).toBe("$250.00");
    expect(bucketSpending("bucket-food")).toBe("$20.00");

    // Eating out: carry 150, availability (300 + 150) = 450, spend 20 (remainder 430)
    expect(bucketCarryOver("bucket-eating-out")).toBe(
      "Allowance $300.00 + carried $150.00"
    );
    expect(bucketAvailability("bucket-eating-out")).toBe("$450.00");
  });

  it("carries debt forward into the next month as $0.00 (-deficit)", async () => {
    // Food overspends in May (allowance 200, spend 210 -> remainder -10); the
    // -10 debt is carried into June. Pin to June so that month is viewable.
    jest.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    seedEntries([
      { date: ts(2026, MAY), amount: "210", type: "expense", categories_path: ",food," },
    ]);

    const { user } = await renderApp("/buckets");

    // June 2026 (current month): the -10 debt is carried in and shown clearly.
    await screen.findByText("June 2026");
    expect(bucketCarryOver("bucket-food")).toBe(
      "Allowance $200.00 + carried $0.00 (-$10.00)"
    );
    expect(bucketAvailability("bucket-food")).toBe("$190.00");
    expect(bucketSpending("bucket-food")).toBe("$0.00");

    // The May overspend itself reads as $210 of $200 (over budget, 105%).
    await goToPrevMonth(user, "May 2026");
    expect(bucketSpending("bucket-food")).toBe("$210.00");
    expect(bucketAvailability("bucket-food")).toBe("$200.00");
    expect(screen.getByTestId("bucket-food-percentage").textContent).toBe(
      "105%"
    );
  });

  it("recovers from carried debt once spending drops below availability", async () => {
    // Food: only March (spend 250) then April (spend 100). Allowance 200.
    // March: (200 + 0) - 250 = -50 (debt). April: (200 + (-50)) - 100 = 50.
    seedEntries([
      { date: ts(2026, MARCH), amount: "250", type: "expense", categories_path: ",food," },
      { date: ts(2026, APRIL), amount: "100", type: "expense", categories_path: ",food," },
    ]);

    const { user } = await renderApp("/buckets");

    await screen.findByText("May 2026");
    await goToPrevMonth(user, "April 2026");

    // Negative carry is shown as "$0.00 (-$50.00)".
    expect(bucketCarryOver("bucket-food")).toBe(
      "Allowance $200.00 + carried $0.00 (-$50.00)"
    );
    expect(bucketAvailability("bucket-food")).toBe("$150.00");
    expect(bucketSpending("bucket-food")).toBe("$100.00");
  });

  it("shows negative availability as $0.00 (-deficit) when debt exceeds the allowance", async () => {
    // Food overspends heavily in April (allowance 200, spend 500 -> remainder
    // -300). In May the carried debt (-300) outweighs the allowance, so
    // availability = 200 + (-300) = -100.
    seedEntries([
      { date: ts(2026, APRIL), amount: "500", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/buckets");

    // May 2026 (current month).
    await screen.findByText("May 2026");

    expect(bucketCarryOver("bucket-food")).toBe(
      "Allowance $200.00 + carried $0.00 (-$300.00)"
    );
    // Carried uses the "$0.00 (-deficit)" form; availability shows the raw
    // negative ("$0.00 of -$100.00").
    expect(bucketAvailability("bucket-food")).toBe("-$100.00");
    expect(bucketSpending("bucket-food")).toBe("$0.00");
  });
});
