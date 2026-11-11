import { screen, waitFor, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, SEPTEMBER, OCTOBER } from "./helpers/seed";

// Viewed on Wednesday Oct 28, 2026, as in design/features/bucket-expenses.
const PINNED_DATE = new Date("2026-10-28T12:00:00");

const seedEatingOut = () => {
  localStorage.setItem("buckets", JSON.stringify({ "Eating out": 300 }));
  seedEntries([
    // September spending of 343.37 carries −43.37 into October.
    { date: ts(2026, SEPTEMBER, 20), amount: "343.37", type: "expense", categories_path: ",eating out,", description: "Dinners out" },
    { date: ts(2026, OCTOBER, 5), amount: "36.00", type: "expense", categories_path: ",eating out,", description: "Taco Tuesday" },
    { date: ts(2026, OCTOBER, 12), amount: "47.68", type: "expense", categories_path: ",eating out,", description: "Burger Joint" },
    { date: ts(2026, OCTOBER, 24), amount: "36.90", type: "expense", categories_path: ",eating out,", description: "Pizza night" },
    { date: ts(2026, OCTOBER, 19), amount: "8.75", type: "expense", categories_path: ",eating out,", description: "Coffee" },
    { date: ts(2026, OCTOBER, 28), amount: "42.50", type: "expense", categories_path: ",eating out,", description: "Sushi Zen" },
    // Another category: never part of this bucket.
    { date: ts(2026, OCTOBER, 27), amount: "999", type: "expense", categories_path: ",housing,", description: "Rent" },
  ]);
};

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("a bucket's standing and expenses (design/features/bucket-expenses)", () => {
  it("shows Left, Spent and the pace for the viewed month", async () => {
    seedEatingOut();
    await renderApp("/edit-bucket/eating-out");

    await screen.findByText(/edit bucket: eating out/i);
    expect(screen.getByTestId("bucket-summary-left")).toHaveTextContent("$84.80");
    expect(screen.getByTestId("bucket-summary-spent")).toHaveTextContent("$171.83");
    expect(screen.getByText("67% used")).toBeInTheDocument();
    expect(screen.getByText(/carried −\$43\.37 from earlier/i)).toBeInTheDocument();
    expect(screen.getByTestId("bucket-summary-pace")).toHaveTextContent(
      /\$59\.96 under pace.*Expected by Oct 28: \$231\.79/i
    );
  });

  it("groups the expenses by week, newest first, each against its pace", async () => {
    seedEatingOut();
    await renderApp("/edit-bucket/eating-out");

    const weeks = await screen.findAllByTestId("week-row");
    // Two weeks show at first; the rest wait behind "Show earlier weeks".
    expect(weeks).toHaveLength(2);
    expect(within(weeks[0]).getByText("Oct 26 – 28")).toBeInTheDocument();
    expect(within(weeks[0]).getByTestId("week-row-spent")).toHaveTextContent("$42.50");
    expect(within(weeks[0]).getByTestId("week-row-pace")).toHaveTextContent("of $24.84");
    expect(within(weeks[1]).getByText("Oct 19 – 25")).toBeInTheDocument();
    expect(within(weeks[1]).getByTestId("week-row-pace")).toHaveTextContent("of $57.95");
    expect(within(weeks[1]).getByText("Pizza night")).toBeInTheDocument();
    expect(within(weeks[1]).getByText("−$36.90")).toBeInTheDocument();
    // An expense of another category is not listed.
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("reveals the earlier weeks on request", async () => {
    seedEatingOut();
    const { user } = await renderApp("/edit-bucket/eating-out");

    await user.click(await screen.findByRole("button", { name: /show earlier weeks/i }));

    expect(await screen.findAllByTestId("week-row")).toHaveLength(4);
    expect(screen.getByText("Oct 12 – 18")).toBeInTheDocument();
    expect(screen.getByText("Taco Tuesday")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show earlier weeks/i })).not.toBeInTheDocument();
  });

  it("says when nothing was spent in the month", async () => {
    localStorage.setItem("buckets", JSON.stringify({ "Eating out": 300 }));
    seedEntries([
      { date: ts(2026, OCTOBER, 3), amount: "10", type: "income", categories_path: ",salary," },
    ]);
    await renderApp("/edit-bucket/eating-out");

    expect(await screen.findByText("No expenses in Eating out yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add an expense/i })).toHaveAttribute("href", "/add-expense");
    expect(screen.queryByTestId("week-row")).not.toBeInTheDocument();
  });

  it("flags spending ahead of the pace", async () => {
    localStorage.setItem("buckets", JSON.stringify({ "Eating out": 300 }));
    seedEntries([
      { date: ts(2026, OCTOBER, 2), amount: "200", type: "expense", categories_path: ",eating out,", description: "Party" },
    ]);
    await renderApp("/edit-bucket/eating-out");

    // 300 × 28 ÷ 31 = 270.97 expected; 200 spent is under it.
    expect(await screen.findByTestId("bucket-summary-pace")).toHaveTextContent(/under pace/i);
    expect(screen.getByTestId("week-row-spent")).toHaveTextContent("$200.00");
  });

  it("shows Over, and no pace, once carried debt leaves nothing available", async () => {
    localStorage.setItem("buckets", JSON.stringify({ "Eating out": 100 }));
    seedEntries([
      { date: ts(2026, SEPTEMBER, 3), amount: "250", type: "expense", categories_path: ",eating out,", description: "Feast" },
      { date: ts(2026, OCTOBER, 3), amount: "20", type: "expense", categories_path: ",eating out,", description: "Snack" },
    ]);
    await renderApp("/edit-bucket/eating-out");

    // Carried −150: available is −50 before spending, then 20 spent: Over 70.
    expect(await screen.findByText("Over")).toBeInTheDocument();
    expect(screen.getByTestId("bucket-summary-left")).toHaveTextContent("$70.00");
    expect(screen.queryByTestId("bucket-summary-pace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("week-row-pace")).not.toBeInTheDocument();
  });

  it("uses the bucket name for an expense without a description", async () => {
    localStorage.setItem("buckets", JSON.stringify({ "Eating out": 300 }));
    seedEntries([
      { date: ts(2026, OCTOBER, 5), amount: "12", type: "expense", categories_path: ",eating out,", description: "" },
    ]);
    await renderApp("/edit-bucket/eating-out");

    const [week] = await screen.findAllByTestId("week-row");
    expect(within(week).getByText("Eating out")).toBeInTheDocument();
  });

  it("keeps editing the allowance: Submit saves, closes the sheet and updates the screen", async () => {
    seedEatingOut();
    const { user } = await renderApp("/edit-bucket/eating-out");

    await user.click(await screen.findByRole("button", { name: /edit monthly allowance/i }));
    const input = await screen.findByPlaceholderText(/insert bucket amount/i);
    expect(input).toHaveValue(300);
    await user.clear(input);
    await user.type(input, "400");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByTestId("bucket-summary-allowance")).toHaveTextContent("$400.00");
    expect(screen.getByTestId("bucket-summary-left")).toHaveTextContent("$184.80");
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/insert bucket amount/i)).not.toBeInTheDocument()
    );
    // Still on the bucket's screen.
    expect(screen.getByText(/edit bucket: eating out/i)).toBeInTheDocument();
  });

  it("Cancel closes the sheet without saving", async () => {
    seedEatingOut();
    const { user } = await renderApp("/edit-bucket/eating-out");

    await user.click(await screen.findByRole("button", { name: /edit monthly allowance/i }));
    const input = await screen.findByPlaceholderText(/insert bucket amount/i);
    await user.clear(input);
    await user.type(input, "999");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByPlaceholderText(/insert bucket amount/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("bucket-summary-allowance")).toHaveTextContent("$300.00");
  });

  it("is translated: the weeks and the pace read in Spanish", async () => {
    seedEatingOut();
    localStorage.setItem("settings.language", "es");
    await renderApp("/edit-bucket/eating-out");

    expect(await screen.findByText(/por debajo del ritmo/i)).toBeInTheDocument();
    expect(screen.getByText("Gastos por semana")).toBeInTheDocument();
    expect(screen.getByText("26 – 28 oct")).toBeInTheDocument();
  });
});
