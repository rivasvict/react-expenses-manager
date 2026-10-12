import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, SeedEntry, ts } from "./helpers/seed";
import { LANGUAGE_STORAGE_KEY } from "../i18n/languagePreference";
import { showChange, showTotalSaved } from "./helpers/trendView";

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
    await showChange(user);
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
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

    const summary = await screen.findByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("+$340.00");
    expect(summary).toHaveTextContent("+26.6%");
    expect(summary).toHaveTextContent("$1,620.00 vs $1,280.00");
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to a year back, naming both years", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));

    const summary = headline("October 2026 vs October 2025");
    expect(summary).toHaveTextContent("+$800.00");
    expect(summary).toHaveTextContent("+97.6%");
    expect(screen.getByRole("button", { name: "Last 12 months" })).toHaveAttribute("aria-pressed", "true");
  });

  it("counts YTD from January of the selected year", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

    await user.click(await screen.findByRole("button", { name: "This year so far" }));

    // January 2026 saved -$180.00, so October is +$1,800.00 against it.
    const summary = headline("October vs January");
    expect(summary).toHaveTextContent("+$1,800.00");
    expect(summary).toHaveTextContent(">999%");
  });

  it("follows the month header back to an earlier month", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);
    await screen.findByRole("group", { name: "October vs April" });

    await stepBack(user, "September 2026");

    // September saved $1,440.00; six months back is March, $920.00.
    const summary = headline("September vs March");
    expect(summary).toHaveTextContent("+$520.00");
    expect(summary).toHaveTextContent("+56.5%");
  });

  it("shows a drop in the amount and the percentage with true minus signs", async () => {
    seedMonths([...SAVINGS.slice(0, -1), 900]);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

    const summary = await screen.findByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("−$380.00");
    expect(summary).toHaveTextContent("−29.7%");
  });

  it("lists the monthly savings for assistive technology", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

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
    await showChange(user);
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
    await showChange(user);
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
    await showChange(user);

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
    await showChange(user);

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

  it("opens on the longest range the history reaches, with every preset selectable", async () => {
    // Four months: July to October 2026.
    seedMonths([100, 200, 300, 400], 2026, 6);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

    expect(await screen.findByRole("group", { name: "October vs July" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 3 months" })).toHaveAttribute("aria-pressed", "true");
    expectPresetsEnabled();
  });

  it("explains a range that reaches before the first recorded month, instead of showing a shorter one", async () => {
    seedMonths([100, 200, 300, 400], 2026, 6);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);
    await screen.findByRole("group", { name: "October vs July" });

    await user.click(screen.getByRole("button", { name: "Last 6 months" }));

    expect(screen.getByText("Not enough history for this range")).toBeInTheDocument();
    expect(
      screen.getByText("Your records start in July 2026. Compare with it instead, or pick a shorter range.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /^October/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "true");
    expectPresetsEnabled();
  });

  it("compares with the first recorded month from the explanation", async () => {
    seedMonths([100, 200, 300, 400], 2026, 6);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);
    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));

    await user.click(screen.getByRole("button", { name: "Compare with July 2026" }));

    expect(headline("October vs July")).toHaveTextContent("+$300.00");
    expect(screen.getByRole("button", { name: "Custom range" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Not enough history for this range")).not.toBeInTheDocument();
  });

  it("keeps every preset selectable, and the picked one picked, when the month header steps back", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await showChange(user);
    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));
    expect(headline("October 2026 vs October 2025")).toBeInTheDocument();

    // Back to March 2026: only five earlier months are recorded.
    for (const title of ["September 2026", "August 2026", "July 2026", "June 2026", "May 2026", "April 2026", "March 2026"]) {
      await stepBack(user, title);
    }

    expect(screen.getByText("Not enough history for this range")).toBeInTheDocument();
    expect(screen.getByText(/Your records start in October 2025/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last 12 months" })).toHaveAttribute("aria-pressed", "true");
    expectPresetsEnabled();
    await user.click(screen.getByRole("button", { name: "Last 3 months" }));
    expect(headline("March 2026 vs December 2025")).toBeInTheDocument();
  });

  it("compares January with December for YTD, like 1M", async () => {
    jest.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    seedMonths(SAVINGS.slice(0, 4));
    const { user } = await renderApp("/savings-trend");
    await showChange(user);

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
    await showChange(user);
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
    await showChange(user);
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
    expect(await screen.findByRole("tab", { name: "Ahorro total" })).toHaveAttribute("aria-selected", "true");
    expect(headline("Ahorro total, abr – oct")).toHaveTextContent("$8,720.00");
    expect(headline("Ahorro total, abr – oct")).toHaveTextContent("7 meses · $1,245.71 de media al mes");
    await showChange(user, "Cambio");
    const summary = headline("Octubre frente a abril");
    expect(summary).toHaveTextContent("+$340.00");
    expect(screen.getByRole("button", { name: "Últimos 6 meses" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Último mes" })).toHaveTextContent("1M");
    expect(screen.getByRole("button", { name: "Últimos 12 meses" })).toHaveTextContent("1A");
    expect(screen.getByText(/Verde donde superó a abril/)).toBeInTheDocument();
  });
});

describe("total saved tab", () => {
  const totalChart = () =>
    screen.findByRole("group", { name: /^Total saved from/ });

  it("opens on Total saved, listed on the left of Change", async () => {
    seedMonths(SAVINGS);
    await renderApp("/savings-trend");

    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Total saved", "Change"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("adds up every month of the range, with the months it spans and the average", async () => {
    seedMonths(SAVINGS);
    await renderApp("/savings-trend");

    // April to October 2026: 1,280 + 760 + 1,050 + 1,390 + 1,180 + 1,440 + 1,620.
    const summary = await screen.findByRole("group", { name: "Total saved, Apr – Oct" });
    expect(summary).toHaveTextContent("$8,720.00");
    expect(summary).toHaveTextContent("7 months · $1,245.71 avg per month");
    expect(summary).not.toHaveTextContent("%");
  });

  it("names both years when the range crosses a year", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));

    const summary = headline("Total saved, Oct 2025 – Oct 2026");
    expect(summary).toHaveTextContent("$11,610.00");
    expect(summary).toHaveTextContent("13 months · $893.08 avg per month");
  });

  it("follows the range and the month header", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Last 2 months" }));
    expect(headline("Total saved, Aug – Oct")).toHaveTextContent("$4,240.00");

    await stepBack(user, "September 2026");
    // The 2M range now ends in September: July + August + September.
    expect(headline("Total saved, Jul – Sep")).toHaveTextContent("$4,010.00");
  });

  it("shows a negative total with a true minus", async () => {
    seedMonths([-500, -300, -800], 2026, 7);
    await renderApp("/savings-trend");

    const summary = await screen.findByRole("group", { name: "Total saved, Aug – Oct" });
    expect(summary).toHaveTextContent("−$1,600.00");
    expect(summary).toHaveTextContent("3 months · −$533.33 avg per month");
  });

  it("counts a month with no incomes or expenses as $0.00 in the total", async () => {
    // June is the first recorded month and July has no entries at all, so the
    // 3M range (July to October) spans one empty month.
    seedEntries([
      { date: ts(2026, 5), amount: "50", type: "income", categories_path: ",salary," },
      { date: ts(2026, 7), amount: "100", type: "income", categories_path: ",salary," },
      { date: ts(2026, 8), amount: "200", type: "income", categories_path: ",salary," },
      { date: ts(2026, 9), amount: "300", type: "income", categories_path: ",salary," },
    ]);
    const { user } = await renderApp("/savings-trend");
    await user.click(await screen.findByRole("button", { name: "Last 3 months" }));

    // July adds nothing: $0.00 + $100.00 + $200.00 + $300.00, over 4 months.
    const summary = headline("Total saved, Jul – Oct");
    expect(summary).toHaveTextContent("$600.00");
    expect(summary).toHaveTextContent("4 months · $150.00 avg per month");
  });

  it("switches to the change and back, keeping the tab while the range changes", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    await showChange(user);
    expect(screen.getByRole("tab", { name: "Change" })).toHaveAttribute("aria-selected", "true");
    expect(headline("October vs April")).toHaveTextContent("+$340.00");
    expect(screen.queryByRole("group", { name: /^Total saved/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Last 3 months" }));
    expect(headline("October vs July")).toBeInTheDocument();

    await showTotalSaved(user);
    expect(headline("Total saved, Jul – Oct")).toHaveTextContent("$5,630.00");
  });

  it("moves between the tabs with the arrow keys", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");

    (await screen.findByRole("tab", { name: "Total saved" })).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Change" })).toHaveFocus();
    expect(headline("October vs April")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Total saved" })).toHaveFocus();
  });

  it("plots the running total and lists it for assistive technology", async () => {
    seedMonths(SAVINGS);
    await renderApp("/savings-trend");

    expect(
      await screen.findByRole("group", {
        name: "Total saved from April 2026 to October 2026, ending at $8,720.00",
      })
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Monthly savings" });
    const rows = within(table).getAllByRole("row");
    expect(rows[0]).toHaveTextContent("MonthSavingsTotal so far");
    expect(rows[1]).toHaveTextContent("April 2026$1,280.00$1,280.00");
    expect(rows[7]).toHaveTextContent("October 2026$1,620.00$8,720.00");
    expect(screen.getByText("Zero line")).toBeInTheDocument();
    expect(screen.getByText(/It rises in months you save and falls in months you overspend/)).toBeInTheDocument();
  });

  it("reads a month on the chart: the total so far and what that month saved", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    const plot = await totalChart();

    // jsdom has no layout, so a tap lands in the middle of the plot: July.
    await user.click(plot);
    expect(tooltipMonth("July 2026")).toBeInTheDocument();
    expect(screen.getByText("+$1,390.00 that month")).toBeInTheDocument();
    expect(screen.getByTestId("chart-tooltip")).toHaveTextContent("$4,480.00");

    await user.click(plot);
    expect(tooltipMonth("July 2026")).not.toBeInTheDocument();
  });

  it("shows a month that overspent as a loss in the tooltip", async () => {
    seedMonths(SAVINGS);
    const { user } = await renderApp("/savings-trend");
    await user.click(await screen.findByRole("button", { name: "Last 12 months" }));
    const plot = await totalChart();

    plot.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    // January 2026 (the fourth month after October 2025) saved -$180.00.
    expect(tooltipMonth("January 2026")).toBeInTheDocument();
    expect(screen.getByText("−$180.00 that month")).toBeInTheDocument();
  });
});
