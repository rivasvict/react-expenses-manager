import { screen } from "@testing-library/react";
import { renderApp } from "./renderApp";

type User = Awaited<ReturnType<typeof renderApp>>["user"];

/**
 * Opens the "Filters & sort" sheet/panel from the entry-list toolbar and waits
 * for its heading, mirroring what a real user does. Use this instead of inline
 * button-click calls so the interaction stays consistent across test files
 * (the category picker lives inside the sheet since the filters UX landed).
 */
export async function openFilterSheet(user: User): Promise<void> {
  await user.click(await screen.findByRole("button", { name: /open filters/i }));
  await screen.findByRole("heading", { name: /filters & sort/i });
}

/**
 * Types a term into the toolbar's live "Search entries" field. Use this for
 * tests that only need to narrow the list; tests exercising the search
 * mechanics themselves should drive the input directly.
 */
export async function searchEntries(user: User, term: string): Promise<void> {
  await user.type(
    await screen.findByRole("textbox", { name: "Search entries" }),
    term
  );
}
