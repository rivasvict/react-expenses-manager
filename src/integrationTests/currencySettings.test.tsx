import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
  seedEntries([
    {
      date: ts(2026, MAY),
      amount: "1500",
      type: "income",
      categories_path: ",salary,",
    },
    {
      date: ts(2026, MAY),
      amount: "40",
      description: "Lunch",
      type: "expense",
      categories_path: ",eating out,",
    },
  ]);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

type User = Awaited<ReturnType<typeof renderApp>>["user"];

const pickCurrency = async (user: User, currencyName: RegExp) => {
  await user.click(await screen.findByRole("radio", { name: currencyName }));
};

const goHome = async (user: User) => {
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  await user.click(within(nav).getByText("Home"));
  await screen.findByText("May 2026");
};

describe("currency settings", () => {
  it("shows amounts in US Dollar by default", async () => {
    await renderApp("/");

    expect(await screen.findByTitle("Incomes")).toHaveTextContent("$1,500.00");
    expect(screen.getByTitle("Expenses")).toHaveTextContent("$40.00");
  });

  it("shows every screen's amounts in the currency picked on Settings", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Settings" }));
    await pickCurrency(user, /Euro/);
    await goHome(user);

    expect(screen.getByTitle("Incomes")).toHaveTextContent("€1,500.00");
    expect(screen.getByTitle("Expenses")).toHaveTextContent("€40.00");
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();

    await user.click(screen.getByTitle("Expenses"));
    expect(await screen.findByText("Lunch")).toBeInTheDocument();
    expect(screen.getAllByText("€40.00").length).toBeGreaterThan(0);
  });

  it("uses each currency's own symbol and decimals", async () => {
    const { user } = await renderApp("/settings");
    await pickCurrency(user, /Japanese Yen/);
    await goHome(user);

    expect(screen.getByTitle("Incomes")).toHaveTextContent("¥1,500");
    expect(screen.getByTitle("Incomes")).not.toHaveTextContent(".00");
  });

  it("remembers the currency on this device across app loads", async () => {
    const { user, unmount } = await renderApp("/settings");
    await pickCurrency(user, /British Pound/);
    unmount();

    await renderApp("/");

    expect(await screen.findByTitle("Incomes")).toHaveTextContent("£1,500.00");
  });

  it("switches back to US Dollar", async () => {
    const { user } = await renderApp("/settings");
    await pickCurrency(user, /Euro/);
    await pickCurrency(user, /US Dollar/);
    await goHome(user);

    expect(screen.getByTitle("Incomes")).toHaveTextContent("$1,500.00");
  });
});
