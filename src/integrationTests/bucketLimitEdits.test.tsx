import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, JANUARY, FEBRUARY, MARCH, APRIL, MAY } from "./helpers/seed";

// Pinned to May 2026 so we can navigate from May back through earlier months.
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

async function goToPrevMonth(
  user: Awaited<ReturnType<typeof renderApp>>["user"],
  expectedTitle: string
) {
  await user.click(await screen.findByRole("button", { name: /prev/i }));
  await screen.findByText(expectedTitle);
}

async function goToNextMonth(
  user: Awaited<ReturnType<typeof renderApp>>["user"],
  expectedTitle: string
) {
  await user.click(await screen.findByRole("button", { name: /next/i }));
  await screen.findByText(expectedTitle);
}

function bucketAvailability(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-availability`).textContent as string;
}

function bucketCarryOver(testIdBase: string): string {
  return screen.getByTestId(`${testIdBase}-carry-over`).textContent as string;
}

describe("per-month bucket limit edits (issue #102)", () => {
  it("old-format (number) buckets continue to work unchanged", async () => {
    // Seed the old flat format to verify backward compatibility.
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));
    seedEntries([
      { date: ts(2026, JANUARY), amount: "50", type: "expense", categories_path: ",food," },
    ]);

    const { user } = await renderApp("/buckets");
    await screen.findByText("May 2026");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await goToPrevMonth(user, "February 2026");
    await goToPrevMonth(user, "January 2026");

    expect(bucketAvailability("bucket-food")).toBe("$200.00");
  });

  it("new-format buckets display the effective limit for each month", async () => {
    // Simulate a history where the limit changed in March and again in May.
    localStorage.setItem(
      "buckets",
      JSON.stringify({
        Food: [
          { from: "0000-00", limit: 200 },
          { from: "2026-03", limit: 300 },
          { from: "2026-05", limit: 150 },
        ],
      })
    );
    // Seed a dummy entry in January so the entries tree spans Jan–May and the
    // Prev navigation button becomes available.
    seedEntries([
      { date: ts(2026, JANUARY), amount: "100", type: "income", categories_path: ",salary," },
    ]);

    const { user } = await renderApp("/buckets");
    await screen.findByText("May 2026");

    // May: effective limit is 150 (most recent entry).
    expect(bucketCarryOver("bucket-food")).toMatch(/\$150\.00/);

    await goToPrevMonth(user, "April 2026");
    // April: limit 300 (applied from March).
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);

    await goToPrevMonth(user, "March 2026");
    // March: limit 300 (first month of that edit).
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);

    await goToPrevMonth(user, "February 2026");
    // February: limit 200 (original).
    expect(bucketCarryOver("bucket-food")).toMatch(/\$200\.00/);

    await goToPrevMonth(user, "January 2026");
    // January: limit 200 (original).
    expect(bucketCarryOver("bucket-food")).toMatch(/\$200\.00/);
  });

  it("editing a bucket while viewing March applies the new limit from March forward", async () => {
    localStorage.setItem(
      "buckets",
      JSON.stringify({ Food: [{ from: "0000-00", limit: 200 }] })
    );
    // Dummy entry in January so the entries tree spans Jan–May and navigation
    // buttons are available.
    seedEntries([
      { date: ts(2026, JANUARY), amount: "100", type: "income", categories_path: ",salary," },
    ]);

    const { user } = await renderApp("/buckets");
    await screen.findByText("May 2026");

    // Navigate to March to make that the selected month.
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await screen.findByText("March 2026");

    // Click the Food bucket row to go to the edit page.
    await user.click(await screen.findByRole("link", { name: /edit food/i }));
    await screen.findByText(/edit bucket: food/i);

    // Clear the current value and type the new limit.
    const input = screen.getByPlaceholderText(/insert bucket amount/i);
    await user.clear(input);
    await user.type(input, "300");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Redirected back to the buckets page (March is still selected).
    await screen.findByText("March 2026");
    // March: limit is now 300.
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);

    // April: limit carries forward as 300.
    await goToNextMonth(user, "April 2026");
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);

    // May: limit still 300.
    await goToNextMonth(user, "May 2026");
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);

    // Navigate back to January: limit is still 200 (edit did not go backward).
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await goToPrevMonth(user, "February 2026");
    await goToPrevMonth(user, "January 2026");
    expect(bucketCarryOver("bucket-food")).toMatch(/\$200\.00/);
  });

  it("editing a bucket limit in May does not affect April or earlier", async () => {
    localStorage.setItem(
      "buckets",
      JSON.stringify({
        Food: [
          { from: "0000-00", limit: 200 },
          { from: "2026-03", limit: 300 },
        ],
      })
    );
    // Dummy entry in January so the entries tree spans Jan–May and navigation
    // buttons are available.
    seedEntries([
      { date: ts(2026, JANUARY), amount: "100", type: "income", categories_path: ",salary," },
    ]);

    const { user } = await renderApp("/buckets");
    await screen.findByText("May 2026");

    // Click Food to edit from the May context.
    await user.click(await screen.findByRole("link", { name: /edit food/i }));
    await screen.findByText(/edit bucket: food/i);

    const input = screen.getByPlaceholderText(/insert bucket amount/i);
    await user.clear(input);
    await user.type(input, "150");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await screen.findByText("May 2026");
    // May: new limit 150.
    expect(bucketCarryOver("bucket-food")).toMatch(/\$150\.00/);

    // April: unaffected, still 300.
    await goToPrevMonth(user, "April 2026");
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);

    // February: unaffected, still 200.
    await goToPrevMonth(user, "March 2026");
    await goToPrevMonth(user, "February 2026");
    expect(bucketCarryOver("bucket-food")).toMatch(/\$200\.00/);
  });

  it("the carry-on calculation uses the per-month limit, not a single global limit", async () => {
    // Food: limit 200 initially, raised to 300 in March.
    // Expenses: 250 in February (over budget by 50).
    // March availability should be: 300 (new limit) + (-50 carry) = 250.
    localStorage.setItem(
      "buckets",
      JSON.stringify({
        Food: [
          { from: "0000-00", limit: 200 },
          { from: "2026-03", limit: 300 },
        ],
      })
    );
    seedEntries([
      // Spend the entire January food allowance (200) so carry-over to February
      // is zero — matching the test's comment that February is "over budget by 50".
      // The January entry also anchors the entries tree to Jan–May, enabling
      // the Prev navigation button.
      { date: ts(2026, JANUARY), amount: "200", type: "expense", categories_path: ",food," },
      { date: ts(2026, FEBRUARY), amount: "250", type: "expense", categories_path: ",food," },
    ]);

    const { user } = await renderApp("/buckets");
    await screen.findByText("May 2026");

    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");

    // March: allowance 300, carry-over -50 → availability 250.
    expect(bucketCarryOver("bucket-food")).toMatch(/\$300\.00/);
    expect(bucketAvailability("bucket-food")).toBe("$250.00");
  });
});
