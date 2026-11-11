import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, SEPTEMBER, OCTOBER } from "./helpers/seed";
import { pickWeeklyView } from "./helpers/settings";
import { tapNext } from "./helpers/onboarding";

// Viewed on Wednesday Oct 28, 2026, as in design/features/bucket-expenses.
const PINNED_DATE = new Date("2026-10-28T12:00:00");

const seedEatingOut = () => {
  localStorage.setItem("buckets", JSON.stringify({ "Eating out": 300 }));
  seedEntries([
    { date: ts(2026, SEPTEMBER, 20), amount: "343.37", type: "expense", categories_path: ",eating out,", description: "Dinners out" },
    { date: ts(2026, OCTOBER, 5), amount: "36.00", type: "expense", categories_path: ",eating out,", description: "Taco Tuesday" },
    { date: ts(2026, OCTOBER, 24), amount: "36.90", type: "expense", categories_path: ",eating out,", description: "Pizza night" },
    { date: ts(2026, OCTOBER, 28), amount: "42.50", type: "expense", categories_path: ",eating out,", description: "Sushi Zen" },
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

describe("the weekly spending view setting", () => {
  it("defaults to week rows and shows the current choice on its Settings row", async () => {
    await renderApp("/settings");

    const row = await screen.findByRole("button", { name: /^Weekly spending/ });
    expect(row).toHaveTextContent("Week rows");
  });

  it("offers the three views with a line on what each looks like", async () => {
    const { user } = await renderApp("/settings");

    await user.click(await screen.findByRole("button", { name: /^Weekly spending/ }));

    expect(await screen.findByRole("radio", { name: /Week rows/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Weekly bars.*column for each week/i })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Month line.*one line of spending/i })).not.toBeChecked();
  });

  it("keeps week rows on the bucket screen by default", async () => {
    seedEatingOut();
    await renderApp("/edit-bucket/eating-out");

    expect(await screen.findAllByTestId("week-row")).not.toHaveLength(0);
    expect(screen.queryByTestId("week-bars")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pace-line")).not.toBeInTheDocument();
    expect(screen.getByText("Expenses by week")).toBeInTheDocument();
  });

  it("draws a column per week, quiet weeks included, when Weekly bars is picked", async () => {
    seedEatingOut();
    const { user } = await renderApp("/settings");
    await pickWeeklyView(user, /Weekly bars/);
    expect(await screen.findByRole("button", { name: /^Weekly spending/ })).toHaveTextContent("Weekly bars");

    const { unmount } = await renderApp("/edit-bucket/eating-out");
    const chart = await screen.findByTestId("week-bars");

    expect(within(chart).getByText(/Spent per week \(\$\)/)).toBeInTheDocument();
    // Oct 1–4, 5–11, 12–18, 19–25 and 26–28: five weeks, one of them quiet in the middle.
    expect(within(chart).getByText("Oct 1–4")).toBeInTheDocument();
    expect(within(chart).getByText("Oct 12–18")).toBeInTheDocument();
    expect(within(chart).getByText("42.50")).toBeInTheDocument();
    expect(within(chart).getByText(/dashed line is what you can spend in a week/i)).toBeInTheDocument();
    // The list keeps its weeks as plain subtotals: no per-week bar or pace.
    expect(screen.queryByTestId("week-row-pace")).not.toBeInTheDocument();
    expect(screen.queryByText("Expenses by week")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("week-row")[0]).toHaveTextContent("$42.50");
    unmount();
  });

  it("draws one line through the month when Month line is picked", async () => {
    seedEatingOut();
    const { user } = await renderApp("/settings");
    await pickWeeklyView(user, /Month line/);

    const { unmount } = await renderApp("/edit-bucket/eating-out");
    const chart = await screen.findByTestId("pace-line");

    expect(within(chart).getByText("Spending through the month")).toBeInTheDocument();
    expect(within(chart).getByText("Available $256.63")).toBeInTheDocument();
    expect(within(chart).getByText("Spent so far")).toBeInTheDocument();
    expect(within(chart).getByText("Even pace to $256.63")).toBeInTheDocument();
    expect(screen.queryByTestId("week-bars")).not.toBeInTheDocument();
    expect(screen.queryByTestId("week-row-pace")).not.toBeInTheDocument();
    unmount();
  });

  it("still shows the standing, the pace line and the editor with a chart view", async () => {
    localStorage.setItem("settings.weeklyView", "line");
    seedEatingOut();
    const { user } = await renderApp("/edit-bucket/eating-out");

    expect(await screen.findByTestId("bucket-summary-pace")).toHaveTextContent(/under pace/i);
    await user.click(screen.getByRole("button", { name: /edit monthly allowance/i }));
    expect(await screen.findByPlaceholderText(/insert bucket amount/i)).toHaveValue(300);
  });

  it("draws no chart for a bucket with nothing spent", async () => {
    localStorage.setItem("settings.weeklyView", "bars");
    localStorage.setItem("buckets", JSON.stringify({ "Eating out": 300 }));
    await renderApp("/edit-bucket/eating-out");

    expect(await screen.findByText("No expenses in Eating out yet")).toBeInTheDocument();
    expect(screen.queryByTestId("week-bars")).not.toBeInTheDocument();
  });

  it("is translated in Spanish", async () => {
    localStorage.setItem("settings.language", "es");
    const { user } = await renderApp("/settings");

    await user.click(await screen.findByRole("button", { name: /^Gasto semanal/ }));
    expect(await screen.findByRole("radio", { name: /Barras semanales/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Línea del mes/ })).toBeInTheDocument();
  });
});

describe("the first-run wizard", () => {
  it("never offers the weekly spending view", async () => {
    const { user } = await renderApp("/", { newUser: true });

    // Walk the preferences step and the following ones: the setting is not there.
    expect(screen.queryByText(/weekly spending/i)).not.toBeInTheDocument();
    await tapNext(user);
    expect(screen.queryByText(/weekly spending/i)).not.toBeInTheDocument();
  });
});
