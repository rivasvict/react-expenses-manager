import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";
import { selectCategory } from "./helpers/categorySelect";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

const getEntryRow = (name: RegExp) => screen.findByRole("link", { name });

describe("entry added date", () => {
  it("shows the day a new entry was added, and keeps it after an edit", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(
      await screen.findByPlaceholderText(/insert expense amount/i),
      "50"
    );
    await user.type(screen.getByPlaceholderText(/description/i), "Groceries");
    await selectCategory(user, "Food");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await user.click(await screen.findByText("Expenses"));
    const row = await getEntryRow(/groceries/i);
    expect(within(row).getByText("Added May 15, 2026")).toBeInTheDocument();

    // Editing days later keeps the original added date.
    jest.setSystemTime(new Date("2026-05-20T12:00:00Z"));
    await user.click(row);
    const amountInput = await screen.findByPlaceholderText(/insert.*amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, "75", { skipClick: true });
    await user.click(screen.getByRole("button", { name: /submit/i }));

    const editedRow = await getEntryRow(/groceries/i);
    expect(within(editedRow).getByText("$75.00")).toBeInTheDocument();
    expect(
      within(editedRow).getByText("Added May 15, 2026")
    ).toBeInTheDocument();
  });

  it("shows no added date for entries saved before dates were recorded", async () => {
    seedEntries([
      {
        date: ts(2026, MAY, 3),
        amount: "20",
        description: "Old lunch",
        type: "expense",
        categories_path: ",eating out,",
      },
      {
        date: ts(2026, MAY, 4),
        amount: "30",
        description: "Restored dinner",
        type: "expense",
        categories_path: ",eating out,",
        addedAt: new Date("2026-05-04T12:00:00Z").getTime(),
      },
    ]);
    await renderApp("/expenses");

    const legacyRow = await getEntryRow(/old lunch/i);
    expect(within(legacyRow).getByText("$20.00")).toBeInTheDocument();
    expect(within(legacyRow).queryByText(/^Added /)).not.toBeInTheDocument();

    const stampedRow = await getEntryRow(/restored dinner/i);
    expect(
      within(stampedRow).getByText("Added May 4, 2026")
    ).toBeInTheDocument();
  });
});
