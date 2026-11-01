import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, APRIL, MAY } from "./helpers/seed";
import { pickLanguage } from "./helpers/settings";

// Pinned to May 2026 so April is reachable as "last month" for the
// carried-debt scenario (issue #111).
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("buckets", JSON.stringify({ Food: 300 }));
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

function bucketSpentText(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-spending`).textContent as string;
}

function bucketRemainingText(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-remaining`).textContent as string;
}

describe("bucket Spent/Remaining legend (issue #111)", () => {
  it("shows Spent and Remaining above the bar when within budget", async () => {
    // Food: allowance 300, no carry-over (first recorded month), spend 100.
    // Remaining = 300 - 100 = 200.
    seedEntries([
      { date: ts(2026, MAY), amount: "100", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/buckets");
    await screen.findByText("May 2026");

    expect(bucketSpentText("bucket-food")).toBe("$100.00");
    expect(bucketRemainingText("bucket-food")).toBe("$200.00");
    expect(screen.getByTestId("bucket-food-remaining-label")).toHaveTextContent(
      "Left"
    );
  });

  it("shows a negative Remaining when the current month is overspent", async () => {
    // Food: allowance 300, no carry-over, spend 420.
    // Remaining = 300 - 420 = -120.
    seedEntries([
      { date: ts(2026, MAY), amount: "420", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/buckets");
    await screen.findByText("May 2026");

    expect(bucketSpentText("bucket-food")).toBe("$420.00");
    expect(bucketRemainingText("bucket-food")).toBe("$120.00");
    expect(screen.getByTestId("bucket-food-remaining-label")).toHaveTextContent(
      "Over"
    );
  });

  it("shows a negative Remaining carried in from a prior month's overspend, even with no spending this month", async () => {
    // April: allowance 300, spend 700 -> remainder -400.
    // May (current, no entries): availability = 300 + (-400) = -100, spend 0.
    // Remaining = -100 - 0 = -100.
    seedEntries([
      { date: ts(2026, APRIL), amount: "700", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/buckets");
    await screen.findByText("May 2026");

    expect(bucketSpentText("bucket-food")).toBe("$0.00");
    expect(bucketRemainingText("bucket-food")).toBe("$100.00");
    expect(screen.getByTestId("bucket-food-remaining-label")).toHaveTextContent(
      "Over"
    );
  });

  it("no longer shows the redundant availability figure above the bar", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "100", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/buckets");
    await screen.findByText("May 2026");

    expect(screen.queryByTestId("bucket-food-availability")).toBeNull();
  });

  it("shows the card labels in Spanish, with the carried debt as a signed amount", async () => {
    // April: allowance 300, spend 400 -> carries -100 into May; May spend 50.
    seedEntries([
      { date: ts(2026, APRIL), amount: "400", type: "expense", categories_path: ",food," },
      { date: ts(2026, MAY), amount: "50", type: "expense", categories_path: ",food," },
    ]);

    const { user } = await renderApp("/settings");
    await pickLanguage(user, /Español/);
    await user.click(screen.getByRole("link", { name: "Límites" }));
    await screen.findByText("Mayo 2026");

    expect(screen.getByTestId("bucket-food-remaining-label")).toHaveTextContent(
      "Disponible"
    );
    expect(screen.getByTestId("bucket-food-carry-over")).toHaveTextContent(
      "Asignación $300.00 Arrastrado \u2212$100.00"
    );
  });
});
