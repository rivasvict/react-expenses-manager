import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, SEPTEMBER, OCTOBER } from "./helpers/seed";
import { goToNextMonth, goToPrevMonth } from "./helpers/navigation";

const PINNED_DATE = new Date("2026-10-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// September saves $1,440.00; October saves $4,200.00 minus `octoberExpenses`.
const seedSeptemberAndOctober = (octoberExpenses: string) =>
  seedEntries([
    { date: ts(2026, SEPTEMBER), amount: "4000", type: "income", categories_path: ",salary," },
    { date: ts(2026, SEPTEMBER), amount: "2560", type: "expense", categories_path: ",rent," },
    { date: ts(2026, OCTOBER), amount: "4200", type: "income", categories_path: ",salary," },
    { date: ts(2026, OCTOBER), amount: octoberExpenses, type: "expense", categories_path: ",rent," },
  ]);

describe("dashboard savings change", () => {
  it("shows a rise against the previous month under the savings amount", async () => {
    seedSeptemberAndOctober("2580");
    await renderApp("/");

    expect(await screen.findByText("$1,620.00")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Savings up 12.5% compared with September",
      })
    ).toHaveTextContent("+12.5%");
  });

  it("shows a drop against the previous month", async () => {
    seedSeptemberAndOctober("2940");
    await renderApp("/");

    expect(await screen.findByText("$1,260.00")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Savings down 12.5% compared with September",
      })
    ).toHaveTextContent("−12.5%");
  });

  it("follows the month header: the first month with data has nothing to compare", async () => {
    seedSeptemberAndOctober("2580");
    const { user } = await renderApp("/");

    await goToPrevMonth(user, "September 2026");
    expect(
      screen.getByText("Nothing to compare with August")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /compared with/ })
    ).not.toBeInTheDocument();

    await goToNextMonth(user, "October 2026");
    expect(
      screen.getByRole("img", {
        name: "Savings up 12.5% compared with September",
      })
    ).toBeInTheDocument();
  });
});
