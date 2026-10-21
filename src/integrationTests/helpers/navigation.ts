import { screen, within } from "@testing-library/react";
import { renderApp } from "./renderApp";

type User = Awaited<ReturnType<typeof renderApp>>["user"];

export async function goToPrevMonth(user: User, expectedTitle: string): Promise<void> {
  await user.click(await screen.findByRole("button", { name: /prev/i }));
  await screen.findByText(expectedTitle);
}

export async function goToNextMonth(user: User, expectedTitle: string): Promise<void> {
  await user.click(await screen.findByRole("button", { name: /next/i }));
  await screen.findByText(expectedTitle);
}

/**
 * Opens the month picker from the header's month title, steps to `year` and
 * picks `monthName` (the full name, e.g. "March"). The sheet closes on pick.
 */
export async function pickMonth(
  user: User,
  currentTitle: string,
  year: number,
  monthName: string
): Promise<void> {
  await user.click(await screen.findByRole("button", { name: currentTitle }));
  const dialog = await screen.findByRole("dialog");
  const inDialog = within(dialog);
  while (!inDialog.queryByText(String(year))) {
    const going = Number(inDialog.getByText(/^\d{4}$/).textContent) > year;
    await user.click(
      inDialog.getByRole("button", { name: going ? /previous year/i : /next year/i })
    );
  }
  await user.click(inDialog.getByRole("button", { name: `${monthName} ${year}` }));
}
