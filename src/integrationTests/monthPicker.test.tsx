import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { pickMonth } from "./helpers/navigation";
import { seedEntries, ts, MARCH, OCTOBER } from "./helpers/seed";

const PINNED_DATE = new Date("2026-10-15T12:00:00Z");

const seedTwoYears = () =>
  seedEntries([
    { date: ts(2025, MARCH), amount: "2000", type: "income", categories_path: ",salary,", description: "March Salary" },
    { date: ts(2026, OCTOBER), amount: "3000", type: "income", categories_path: ",salary,", description: "October Salary" },
  ]);

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("month and year picker", () => {
  it("jumps to a month in an earlier year from the month title", async () => {
    seedTwoYears();
    const { user } = await renderApp("/");
    await screen.findByText("October 2026");

    await pickMonth(user, "October 2026", 2025, "March");

    expect(await screen.findByText("March 2025")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dims months outside the data range and the year steppers at the edges", async () => {
    seedTwoYears();
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: "October 2026" }));
    const dialog = within(await screen.findByRole("dialog"));

    expect(dialog.getByRole("button", { name: "November 2026" })).toBeDisabled();
    expect(dialog.getByRole("button", { name: "October 2026" })).toHaveAttribute("aria-pressed", "true");
    expect(dialog.getByRole("button", { name: /next year/i })).toBeDisabled();

    await user.click(dialog.getByRole("button", { name: /previous year/i }));
    expect(dialog.getByRole("button", { name: "February 2025" })).toBeDisabled();
    expect(dialog.getByRole("button", { name: "March 2025" })).toBeEnabled();
    expect(dialog.getByRole("button", { name: /previous year/i })).toBeDisabled();
  });

  it("closes without changing the month when the close button is pressed", async () => {
    seedTwoYears();
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: "October 2026" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("October 2026")).toBeInTheDocument();
  });

  it("works on the other month-based screens", async () => {
    seedTwoYears();
    localStorage.setItem("buckets", JSON.stringify({ "Eating out": 100 }));
    const { user } = await renderApp("/buckets");
    await screen.findByRole("button", { name: "October 2026" });

    await pickMonth(user, "October 2026", 2025, "March");

    expect(await screen.findByText("March 2025")).toBeInTheDocument();
  });

  it("shows month names in the chosen language", async () => {
    seedTwoYears();
    localStorage.setItem("settings.language", "es");
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Octubre 2026" }));
    const dialog = within(await screen.findByRole("dialog"));

    expect(dialog.getByRole("heading", { name: "Ir a un mes" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Noviembre 2026" })).toBeDisabled();
    expect(dialog.getByText("Ene")).toBeInTheDocument();
  });
});
