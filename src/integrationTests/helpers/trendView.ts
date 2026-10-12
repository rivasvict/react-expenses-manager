import { screen } from "@testing-library/react";
import type { renderApp } from "./renderApp";

type User = Awaited<ReturnType<typeof renderApp>>["user"];

/**
 * On /savings-trend, opens the Change tab. The screen opens on Total saved, so
 * tests of the end-month-vs-reference comparison call this first. The tab stays
 * selected while the month or range changes.
 */
export const showChange = async (user: User, tabName = "Change") => {
  await user.click(await screen.findByRole("tab", { name: tabName }));
};

/** Opens the Total saved tab again (e.g. after `showChange`). */
export const showTotalSaved = async (user: User, tabName = "Total saved") => {
  await user.click(await screen.findByRole("tab", { name: tabName }));
};
