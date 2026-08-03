import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
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
  });

  it("still renders the chart (capped) when incomes are zero but there are expenses", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "150", type: "expense", categories_path: ",food," },
    ]);

    await renderApp("/");

    expect(await screen.findByText("$150.00")).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  it("does not render the chart when there is no income or expense data", async () => {
    await renderApp("/");

    // Dashboard has loaded (zero balances shown) but the chart has nothing to plot.
    expect((await screen.findAllByText("$0.00")).length).toBeGreaterThan(0);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });
});
