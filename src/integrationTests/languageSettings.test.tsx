import { screen, within } from "@testing-library/react";
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
  jest.restoreAllMocks();
});

type User = Awaited<ReturnType<typeof renderApp>>["user"];

const pickLanguage = async (user: User, languageName: RegExp) => {
  await user.click(await screen.findByRole("radio", { name: languageName }));
};

describe("language settings", () => {
  it("renders in English by default", async () => {
    await renderApp("/");

    expect(await screen.findByText("May 2026")).toBeInTheDocument();
    expect(screen.getByText("Monthly Balance")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("switches the app to Spanish from the Settings chip in the app bar", async () => {
    seedEntries([
      {
        date: ts(2026, MAY),
        amount: "100",
        type: "income",
        categories_path: ",salary,",
      },
    ]);
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Settings" }));
    await pickLanguage(user, /Español/);

    // The app bar follows at once, without a reload.
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(nav).getByText("Inicio")).toBeInTheDocument();
    expect(within(nav).getByText("Límites")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ajustes" })).toBeInTheDocument();

    await user.click(within(nav).getByText("Inicio"));

    expect(await screen.findByText("Mayo 2026")).toBeInTheDocument();
    expect(screen.getByText("Balance mensual")).toBeInTheDocument();
    expect(screen.getByText("Añadir ingreso")).toBeInTheDocument();
    // Stored data is shown exactly as saved — only the UI is translated.
    expect(screen.getByTitle("Ingresos")).toHaveTextContent("$100.00");
  });

  it("remembers the language on this device across app loads", async () => {
    const { user, unmount } = await renderApp("/settings");
    await pickLanguage(user, /Español/);
    unmount();

    await renderApp("/");

    expect(await screen.findByText("Mayo 2026")).toBeInTheDocument();
    expect(screen.getByText("Balance mensual")).toBeInTheDocument();
  });

  it("switches back to English", async () => {
    const { user } = await renderApp("/settings");
    await pickLanguage(user, /Español/);
    expect(await screen.findByText("Ajustes")).toBeInTheDocument();

    await pickLanguage(user, /English/);

    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).toBeInTheDocument();
  });

  it("keeps the language after clearing all data", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const { user, unmount } = await renderApp("/settings");
    await pickLanguage(user, /Español/);

    await user.click(screen.getByText("Datos"));
    await user.click(
      await screen.findByRole("button", { name: "Borrar todos los datos" })
    );
    unmount();

    await renderApp("/");

    expect(await screen.findByText("Balance mensual")).toBeInTheDocument();
  });

  it("translates validation messages", async () => {
    const { user } = await renderApp("/settings");
    await pickLanguage(user, /Español/);

    await user.click(screen.getByText("Categorías"));
    await user.click(
      await screen.findByRole("link", { name: "Añadir categoría" })
    );
    await user.click(await screen.findByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El nombre de la categoría no puede estar vacío"
    );
  });
});
