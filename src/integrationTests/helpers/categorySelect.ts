import { screen } from "@testing-library/react";
import { renderApp } from "./renderApp";

type User = Awaited<ReturnType<typeof renderApp>>["user"];

/**
 * Picks a category from the searchable category dropdown (CategorySearchSelect):
 * opens the combobox and clicks the matching option, mirroring what a real user
 * does. Use this instead of inline open-then-click calls so the interaction stays
 * consistent across test files. The internal `findByRole("option", ...)` throws
 * when the category is absent, so presence is still asserted.
 */
export async function selectCategory(user: User, categoryName: string): Promise<void> {
  await user.click(await screen.findByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: categoryName }));
}
