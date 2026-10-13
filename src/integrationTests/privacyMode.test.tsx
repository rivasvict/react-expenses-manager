import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";
import { pickLanguage, togglePrivacyMode } from "./helpers/settings";
import { PRIVACY_MODE_STORAGE_KEY } from "../privacy/privacyPreference";

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
});

type User = Awaited<ReturnType<typeof renderApp>>["user"];

const goTo = async (user: User, linkName: string, expectedText: string) => {
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  await user.click(within(nav).getByText(linkName));
  await screen.findByText(expectedText);
};

const goHome = (user: User) => goTo(user, "Home", "May 2026");

const openSettings = async (user: User) => {
  await user.click(await screen.findByRole("link", { name: "Settings" }));
  await screen.findByRole("switch", { name: /^Privacy mode/ });
};

describe("privacy mode", () => {
  it("shows every figure on the dashboard when the mode is off, with no eye", async () => {
    await renderApp("/");

    expect(await screen.findByText("$1,460.00")).toBeInTheDocument();
    expect(screen.getByTitle("Incomes")).toHaveTextContent("$1,500.00");
    expect(screen.getByTitle("Expenses")).toHaveTextContent("$40.00");
    expect(
      screen.queryByRole("button", { name: /figures$/ }),
    ).not.toBeInTheDocument();
  });

  it("starts with the mode off on Settings", async () => {
    const { user } = await renderApp("/");

    await openSettings(user);

    expect(
      screen.getByRole("switch", { name: /^Privacy mode/ }),
    ).not.toBeChecked();
  });

  it("hides the dashboard's figures right after the mode is turned on", async () => {
    const { user } = await renderApp("/");
    await openSettings(user);

    await togglePrivacyMode(user);
    await goHome(user);

    expect(screen.queryByText("$1,460.00")).not.toBeInTheDocument();
    expect(screen.queryByText(/1,500\.00/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$40\.00/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Amount hidden" })).toHaveLength(3);
    expect(
      screen.getByRole("img", { name: "Percentage change hidden" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Chart hidden" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show figures" }),
    ).toBeInTheDocument();
  });

  it("opens hidden when the app starts with the mode already on", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    await renderApp("/");

    expect(
      await screen.findByRole("button", { name: "Show figures" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("$1,460.00")).not.toBeInTheDocument();
  });

  it("shows the figures with the eye and hides them again with it", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Show figures" }));

    expect(await screen.findByText("$1,460.00")).toBeInTheDocument();
    expect(screen.getByTitle("Incomes")).toHaveTextContent("$1,500.00");
    expect(screen.getByTitle("Expenses")).toHaveTextContent("$40.00");
    expect(
      screen.queryByRole("img", { name: "Amount hidden" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide figures" }));

    expect(screen.queryByText("$1,460.00")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show figures" }),
    ).toBeInTheDocument();
  });

  it("keeps the figures shown while moving between screens", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const { user } = await renderApp("/");
    await user.click(await screen.findByRole("button", { name: "Show figures" }));

    await openSettings(user);
    await goHome(user);

    expect(await screen.findByText("$1,460.00")).toBeInTheDocument();
  });

  it("does not hide the figures on the other screens", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const { user } = await renderApp("/");
    await screen.findByRole("button", { name: "Show figures" });

    await user.click(screen.getByTitle("Expenses"));

    expect(await screen.findByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("$40.00")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Amount hidden" }),
    ).not.toBeInTheDocument();
  });

  it("looks exactly like before once the mode is turned off again", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const { user } = await renderApp("/");
    await screen.findByRole("button", { name: "Show figures" });
    await openSettings(user);

    await togglePrivacyMode(user);
    await goHome(user);

    expect(await screen.findByText("$1,460.00")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /figures$/ }),
    ).not.toBeInTheDocument();
  });

  it("is available in Spanish", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const { user } = await renderApp("/");
    await screen.findByRole("button", { name: "Show figures" });
    await user.click(await screen.findByRole("link", { name: "Settings" }));
    await pickLanguage(user, /Español/);

    expect(
      await screen.findByRole("switch", { name: /^Modo privacidad/ }),
    ).toBeChecked();
    await user.click(screen.getByRole("link", { name: "Inicio" }));

    expect(
      await screen.findByRole("button", { name: "Mostrar cifras" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Importe oculto" }),
    ).toHaveLength(3);
  });
});
