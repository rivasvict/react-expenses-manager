import { screen } from "@testing-library/react";
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
