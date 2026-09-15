import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";

// setupTests.js replaces chart.js with a no-op class (jsdom can't paint
// <canvas>). Override it here with a spy that records the config each
// chart instance was constructed with, so we can assert on the actual
// Expenses/Savings percentages the BalanceChart computed and handed to
// Chart.js, not just that a canvas exists.
const mockChartConfigs: any[] = [];
jest.mock("chart.js/auto", () => ({
  Chart: class {
    constructor(_ctx: unknown, config: unknown) {
      mockChartConfigs.push(config);
    }
    update() {}
    destroy() {}
  },
}));

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

const getLastChartConfig = () => mockChartConfigs[mockChartConfigs.length - 1];

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
  mockChartConfigs.length = 0;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("dashboard balance chart", () => {
  it("renders the chart when there are incomes and expenses", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "1000", type: "income", categories_path: ",salary," },
      { date: ts(2026, MAY), amount: "250", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/");

    expect(await screen.findByText("$1,000.00")).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector("canvas")).toBeInTheDocument();

    // $250 expenses / $1,000 income = 25% expenses, 75% savings — income is
    // the 100% base, not incomes + expenses (which would give 20% / 80%).
    const { data } = getLastChartConfig();
    expect(data.labels).toEqual(["Expenses", "Savings"]);
    expect(data.datasets[0].data).toEqual([25, 75]);
  });

  it("still renders the chart (capped) when incomes are zero but there are expenses", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "150", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/");

    expect(await screen.findByText("$150.00")).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector("canvas")).toBeInTheDocument();

    // Zero income is capped at 100% expenses / 0% savings instead of a
    // division-by-zero blowing up or the chart hiding.
    const { data } = getLastChartConfig();
    expect(data.labels).toEqual(["Expenses", "Savings"]);
    expect(data.datasets[0].data).toEqual([100, 0]);
  });

  it("does not render the chart when there is no income or expense data", async () => {
    await renderApp("/");

    // Dashboard has loaded (zero balances shown) but the chart has nothing to plot.
    expect((await screen.findAllByText("$0.00")).length).toBeGreaterThan(0);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });
});
