import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, SeedEntry, ts } from "./helpers/seed";
import { LANGUAGE_STORAGE_KEY } from "../i18n/languagePreference";

const PINNED_DATE = new Date("2026-10-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// Savings of each month from October 2025 to October 2026.
const SAVINGS = [820, 640, 210, -180, 480, 920, 1280, 760, 1050, 1390, 1180, 1440, 1620];

// One income and one expense a month, so month i saves `savings[i]`.
const seedMonths = (savings: number[], firstYear = 2025, firstMonth = 9) => {
  const entries: SeedEntry[] = savings.flatMap((amount, i) => {
    const index = firstMonth + i;
    const date = ts(firstYear + Math.floor(index / 12), index % 12);
    return [
      { date, amount: "4000", type: "income", categories_path: ",salary," },
      { date, amount: String(4000 - amount), type: "expense", categories_path: ",rent," },
    ];
  });
  seedEntries(entries);
};

const headline = (name: string) => screen.getByRole("group", { name });

// The chart also lists its months in a table for screen readers, so month
// names appear more than once: the header is found by its role.
const monthTitle = (name: string) => screen.findByRole("heading", { name });

const stepBack = async (user: Awaited<ReturnType<typeof renderApp>>["user"], title: string) => {
  await user.click(await screen.findByRole("button", { name: /prev/i }));
  await monthTitle(title);
};

// What the chart's tooltip says: its month and the line below it.
const tooltipMonth = (name: string) =>
  screen.queryByText(name, { selector: ".chart-tooltip strong" });

describe("dashboard link to the savings trend", () => {
  it("sits next to the savings change in the savings card and opens the screen", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/");

    expect(await screen.findByText("vs Sep")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Savings trend" }));

    expect(await screen.findByRole("heading", { name: "Savings trend" })).toBeInTheDocument();
    expect(headline("October vs April")).toHaveTextContent("+$340.00");
  });

  it("still opens the summary from the savings amount", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/");

    await user.click(await screen.findByTitle("Summary"));
    expect(await screen.findByText("Monthly Summary")).toBeInTheDocument();
  });
});

describe("savings trend screen", () => {
  it("compares the selected month with six months back by default", async () => {
    seedMonths(SAVINGS);
    await renderApp("/savings-trend");

    const summary = await screen.findByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("+$340.00");
    expect(summary).toHaveTextContent("+26.6%");
    expect(summary).toHaveTextContent("$1,620.00 vs $1,280.00");
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to a year back, naming both years", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));

    const summary = headline("October 2026 vs October 2025");
    expect(summary).toHaveTextContent("+$800.00");
    expect(summary).toHaveTextContent("+97.6%");
    expect(screen.getByRole("button", { name: "Last 12 months" })).toHaveAttribute("aria-pressed", "true");
  });

  it("counts YTD from January of the selected year", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "This year so far" }));

    // January 2026 saved -$180.00, so October is +$1,800.00 against it.
    const summary = headline("October vs January");
    expect(summary).toHaveTextContent("+$1,800.00");
    expect(summary).toHaveTextContent(">999%");
  });

  it("follows the month header back to an earlier month", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await screen.findByRole("group", { name: "October vs April" });

    await stepBack(user, "September 2026");

    // September saved $1,440.00; six months back is March, $920.00.
    const summary = headline("September vs March");
    expect(summary).toHaveTextContent("+$520.00");
    expect(summary).toHaveTextContent("+56.5%");
  });

  it("shows a drop in the amount and the percentage with true minus signs", async () => {
    seedMonths([...SAVINGS.slice(0, -1), 900]);
    await renderApp("/savings-trend");

    const summary = await screen.findByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("−$380.00");
    expect(summary).toHaveTextContent("−29.7%");
  });

  it("lists the monthly savings for assistive technology", async () => {
    seedMonths(SAVINGS);
    await renderApp("/savings-trend");

    const table = await screen.findByRole("table", { name: "Monthly savings" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(8);
    expect(rows[1]).toHaveTextContent("April 2026$1,280.00");
    expect(rows[7]).toHaveTextContent("October 2026$1,620.00");
    expect(
      screen.getByRole("group", {
        name: "Monthly savings from April 2026 to October 2026, ending at $1,620.00",
      })
    ).toBeInTheDocument();
  });

  it("reads a month on the chart with the arrow keys", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    const chart = await screen.findByRole("group", { name: /^Monthly savings from/ });

    chart.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(tooltipMonth("May 2026")).toBeInTheDocument();
    expect(screen.getByText("−$520.00 vs Apr")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(tooltipMonth("May 2026")).not.toBeInTheDocument();
  });

  it("reads the month under a tap on the chart", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    const plot = await screen.findByRole("group", { name: /^Monthly savings from/ });

    // jsdom has no layout, so a tap lands in the middle of the plot: July.
    await user.click(plot);
    expect(tooltipMonth("July 2026")).toBeInTheDocument();
    expect(screen.getByText("+$110.00 vs Apr")).toBeInTheDocument();

    await user.click(plot);
    expect(tooltipMonth("July 2026")).not.toBeInTheDocument();
  });
});

describe("custom range", () => {
  it("compares any two recorded months and moves the month header to the last one", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Custom range" }));
    const sheet = screen.getByRole("dialog", { name: "Custom range" });
    expect(within(sheet).getByLabelText("From")).toHaveDisplayValue("April 2026");
    expect(within(sheet).getByLabelText("To")).toHaveDisplayValue("October 2026");

    await user.selectOptions(within(sheet).getByLabelText("From"), "January 2026");
    await user.selectOptions(within(sheet).getByLabelText("To"), "July 2026");
    await user.click(within(sheet).getByRole("button", { name: "Show trend" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await monthTitle("July 2026")).toBeInTheDocument();
    // July saved $1,390.00 against January's -$180.00.
    const summary = headline("July vs January");
    expect(summary).toHaveTextContent("+$1,570.00");
    expect(summary).toHaveTextContent("+872.2%");
    expect(screen.getByRole("button", { name: "Custom range" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "false");
  });

  it("only offers a From before the To and a To after the From", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Custom range" }));
    const sheet = screen.getByRole("dialog", { name: "Custom range" });
    await user.selectOptions(within(sheet).getByLabelText("From"), "September 2026");

    const toOptions = within(within(sheet).getByLabelText("To"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(toOptions).toEqual(["October 2026"]);
  });

  it("closes without changing anything on Cancel, and returns focus to the button", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    const custom = await screen.findByRole("button", { name: "Custom range" });
    await user.click(custom);
    await user.selectOptions(screen.getByLabelText("From"), "January 2026");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(custom).toHaveFocus();
    expect(headline("October vs April")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Custom range" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("limited history", () => {
  const ALL_PRESETS = [
    "Last month",
    "Last 2 months",
    "Last 3 months",
    "Last 6 months",
    "Last 12 months",
    "This year so far",
  ];
  const expectPresetsEnabled = () =>
    ALL_PRESETS.forEach((name) =>
      expect(screen.getByRole("button", { name })).toBeEnabled()
    );

  it("compares with the first recorded month when a preset reaches further back, keeping every preset selectable", async () => {
    // Four months: July to October 2026.
    seedMonths([100, 200, 300, 400], 2026, 6);
    await renderApp("/savings-trend");

    // 6M is picked but only three months are recorded before October.
    expect(await screen.findByRole("group", { name: "October vs July" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "true");
    expectPresetsEnabled();
  });

  it("keeps every preset selectable, and the picked one picked, when the month header steps back", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));
    expect(headline("October 2026 vs October 2025")).toBeInTheDocument();

    // Back to March 2026: only five earlier months are recorded.
    for (const title of ["September 2026", "August 2026", "July 2026", "June 2026", "May 2026", "April 2026", "March 2026"]) {
      await stepBack(user, title);
    }

    expect(headline("March 2026 vs October 2025")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 12 months" })).toHaveAttribute("aria-pressed", "true");
    expectPresetsEnabled();
    await user.click(screen.getByRole("button", { name: "Last 3 months" }));
    expect(headline("March 2026 vs December 2025")).toBeInTheDocument();
  });

  it("compares January with December for YTD, like 1M", async () => {
    jest.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    seedMonths(SAVINGS.slice(0, 4));
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "This year so far" }));

    // January saved -$180.00 against December's $210.00.
    expect(headline("January 2026 vs December 2025")).toHaveTextContent("−$390.00");
    expectPresetsEnabled();
  });

  it("says there is not enough history when only one month is recorded", async () => {
    seedMonths([1620], 2026, 9);
    await renderApp("/savings-trend");

    expect(await screen.findByText("Not enough history yet")).toBeInTheDocument();
    expect(
      screen.getByText(/A trend needs at least two months/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expectPresetsEnabled();
    // There are no earlier months to pick from.
    expect(screen.getByRole("button", { name: "Custom range" })).toBeDisabled();
  });

  it("says there is not enough history at the first recorded month, and the comparison returns on the next month", async () => {
    seedMonths(SAVINGS.slice(-3), 2026, 7);
    const { user } = await renderApp("/savings-trend");
    await screen.findByRole("group", { name: "October vs August" });

    await stepBack(user, "September 2026");
    await stepBack(user, "August 2026");
    expect(screen.getByText("Not enough history yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    await monthTitle("September 2026");
    expect(headline("September vs August")).toBeInTheDocument();
  });

  it("keeps the amount but drops the percentage when the reference month has no entries", async () => {
    // July has nothing; August and September save a little, October more.
    seedEntries([
      { date: ts(2026, 6), amount: "1", type: "income", categories_path: ",salary," },
      { date: ts(2026, 6), amount: "1", type: "expense", categories_path: ",rent," },
      { date: ts(2026, 9), amount: "300", type: "income", categories_path: ",salary," },
    ]);
    const { user } = await renderApp("/savings-trend");
    await user.click(await screen.findByRole("button", { name: "Last 3 months" }));

    // July saved exactly $0.00, so there is no percentage to give.
    const summary = headline("October vs July");
    expect(summary).toHaveTextContent("+$300.00");
    expect(summary).not.toHaveTextContent("%");
  });
});

describe("savings trend in Spanish", () => {
  it("translates the link, the screen and the month names", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    seedMonths(SAVINGS);
    const { user } = await renderApp("/");

    expect(await screen.findByText("frente a sep")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Tendencia del ahorro" }));

    expect(
      await screen.findByRole("heading", { name: "Tendencia del ahorro" })
    ).toBeInTheDocument();
    const summary = headline("Octubre frente a abril");
    expect(summary).toHaveTextContent("+$340.00");
    expect(screen.getByRole("button", { name: "Últimos 6 meses" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Último mes" })).toHaveTextContent("1M");
    expect(screen.getByRole("button", { name: "Últimos 12 meses" })).toHaveTextContent("1A");
    expect(screen.getByText(/Verde donde superó a abril/)).toBeInTheDocument();
  });
});
