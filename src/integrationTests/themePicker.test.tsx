import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { pickLanguage, pickTheme } from "./helpers/settings";
import { findStepHeading, tapNext, walkToReviewEmpty } from "./helpers/onboarding";

/**
 * The theme picker (design/features/theme-picker/ui/decision.md): a Theme row
 * in Settings opens a sheet of preview cards, a tap recolors the app at once
 * and the sheet stays open; setup step 1 offers the same cards in a strip.
 * `data-theme` on <html> is the observable "the app recolored" signal.
 */

const appTheme = () => document.documentElement.dataset.theme;

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-15T12:00:00"));
});

afterEach(() => {
  jest.useRealTimers();
});

const openSettings = async () => {
  const view = await renderApp("/settings");
  await screen.findByRole("button", { name: /^Theme/ });
  return view;
};

describe("the Theme row and sheet in Settings", () => {
  it("shows the current theme in the row and lists all fifteen in the sheet", async () => {
    const { user } = await openSettings();

    const row = screen.getByRole("button", { name: "Theme: Midnight Gold" });
    expect(row).toHaveTextContent("Colors of the app");

    await user.click(row);

    const dialog = await screen.findByRole("dialog", { name: "Theme" });
    expect(
      within(dialog).getByText("Tap a theme to use it. The app changes right away.")
    ).toBeInTheDocument();
    expect(within(dialog).getAllByRole("radio")).toHaveLength(15);
    expect(within(dialog).getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: "Midnight Gold" })).toHaveAccessibleDescription(
      "The original look"
    );
    expect(within(dialog).getByRole("radio", { name: "All Hallows" })).toHaveAccessibleDescription(
      "Inspired by Halloween"
    );
    expect(appTheme()).toBe("midnight-gold");
  });

  it("recolors the app on a tap and keeps the sheet open", async () => {
    const { user } = await openSettings();

    await pickTheme(user, "All Hallows");

    expect(screen.getByRole("radio", { name: "All Hallows" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).not.toBeChecked();
    expect(appTheme()).toBe("all-hallows");
    expect(screen.getByRole("dialog", { name: "Theme" })).toBeInTheDocument();

    // A person can keep trying themes without reopening the sheet.
    await user.click(screen.getByRole("radio", { name: "Snowglobe" }));
    expect(screen.getByRole("radio", { name: "Snowglobe" })).toBeChecked();
    expect(appTheme()).toBe("snowglobe");
  });

  it("shows the picked theme in the row once the sheet is closed", async () => {
    const { user } = await openSettings();

    await pickTheme(user, "All Hallows");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const row = screen.getByRole("button", { name: "Theme: All Hallows" });
    expect(row).toHaveTextContent("All Hallows");
    expect(row).toHaveFocus();
  });

  it("closes with Escape", async () => {
    const { user } = await openSettings();

    await pickTheme(user, "Nord");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme: Nord" })).toBeInTheDocument();
  });

  it("keeps the theme after the app is opened again", async () => {
    const first = await openSettings();
    await pickTheme(first.user, "Tokyo Night");
    first.unmount();
    delete document.documentElement.dataset.theme;

    await renderApp("/settings");

    expect(await screen.findByRole("button", { name: "Theme: Tokyo Night" })).toBeInTheDocument();
    expect(appTheme()).toBe("tokyo-night");
  });

  it("falls back to the default theme when the stored one is unknown", async () => {
    localStorage.setItem("settings.theme", "not-a-theme");
    await renderApp("/settings");

    expect(await screen.findByRole("button", { name: "Theme: Midnight Gold" })).toBeInTheDocument();
    expect(appTheme()).toBe("midnight-gold");
  });

  it("is labelled in Spanish, with the inspiration translated", async () => {
    const { user } = await renderApp("/settings");
    await pickLanguage(user, /Español/);

    const row = await screen.findByRole("button", { name: "Tema: Midnight Gold" });
    expect(row).toHaveTextContent("Colores de la app");
    await user.click(row);

    const dialog = await screen.findByRole("dialog", { name: "Tema" });
    expect(
      within(dialog).getByText("Toca un tema para usarlo. La app cambia al instante.")
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("radiogroup", { name: "Tema" })).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "Midnight Gold" })).toHaveAccessibleDescription(
      "El aspecto original"
    );
    expect(within(dialog).getByText("Predeterminado")).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "Pumpkin King" })).toHaveAccessibleDescription(
      "Inspirado en Pesadilla antes de Navidad"
    );
  });

  it("draws the preview figures in the display currency", async () => {
    const { user } = await openSettings();
    await user.click(screen.getByRole("button", { name: /^Theme/ }));

    const card = await screen.findByRole("radio", { name: "Nord" });
    expect(within(card).getByText("$1,620.00")).toBeInTheDocument();
    expect(within(card).getByText("$4,200.00")).toBeInTheDocument();
    expect(within(card).getByText("$2,580.00")).toBeInTheDocument();
  });
});

describe("the theme strip in setup", () => {
  it("offers the themes in step 1, applies a tap at once and shows it on the review", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await findStepHeading("Welcome! Let’s set things up");

    const strip = screen.getByRole("radiogroup", { name: "Theme" });
    expect(within(strip).getAllByRole("radio")).toHaveLength(15);
    expect(within(strip).getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
    expect(screen.getByText(/the whole app changes as you pick/)).toBeInTheDocument();

    await user.click(within(strip).getByRole("radio", { name: "All Hallows" }));
    expect(within(strip).getByRole("radio", { name: "All Hallows" })).toBeChecked();
    expect(appTheme()).toBe("all-hallows");

    await tapNext(user);
    await tapNext(user);
    await tapNext(user);
    await tapNext(user);
    expect(await findStepHeading("All set")).toBeInTheDocument();
    expect(screen.getByText("All Hallows · Privacy mode off")).toBeInTheDocument();
  });

  it("keeps the picked theme when the setup is skipped", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await findStepHeading("Welcome! Let’s set things up");

    await user.click(screen.getByRole("radio", { name: "Snowglobe" }));
    await user.click(screen.getByRole("button", { name: "Skip setup" }));

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
    expect(appTheme()).toBe("snowglobe");

    await user.click(screen.getByRole("link", { name: "Settings" }));
    expect(await screen.findByRole("button", { name: "Theme: Snowglobe" })).toBeInTheDocument();
  });

  it("keeps the picked theme after Start tracking", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await findStepHeading("Welcome! Let’s set things up");

    await user.click(screen.getByRole("radio", { name: "Nord" }));
    await walkToReviewEmpty(user);
    await tapNext(user, "Start tracking");

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
    expect(appTheme()).toBe("nord");
  });
});
