import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Helpers for the first-run wizard (design/features/new-user-onboarding).
 * Names default to English; pass the Spanish text once the wizard is in it.
 */

/** Tap the wizard's primary action ("Next", "Start tracking"). */
export const tapNext = async (user: UserEvent, name: string | RegExp = "Next") =>
  user.click(await screen.findByRole("button", { name }));

/** Tap Back. */
export const tapBack = async (user: UserEvent, name: string | RegExp = "Back") =>
  user.click(await screen.findByRole("button", { name }));

/** Wait for a step's heading, so a test never reads the previous step. */
export const findStepHeading = (name: string | RegExp) =>
  screen.findByRole("heading", { level: 1, name });

/** Toggle one category chip on a Expenses or Incomes step. */
export const toggleChip = async (user: UserEvent, categoryName: string) =>
  user.click(await screen.findByRole("button", { name: categoryName }));

/** Type a category of your own and add it. */
export const addOwnCategory = async (
  user: UserEvent,
  categoryName: string,
  { field = "Add your own", button = "Add" }: { field?: string; button?: string } = {}
) => {
  await user.type(await screen.findByRole("textbox", { name: field }), categoryName);
  await user.click(screen.getByRole("button", { name: button }));
};

/** Type a monthly limit for a category on the Buckets step. */
export const setBucketLimit = async (
  user: UserEvent,
  categoryName: string,
  limit: string
) =>
  user.type(
    await screen.findByRole("textbox", { name: `Monthly limit for ${categoryName}` }),
    limit
  );

/** Walk steps 1 to 4 leaving everything unchosen, stopping on Review. */
export const walkToReviewEmpty = async (user: UserEvent) => {
  await tapNext(user);
  await tapNext(user);
  await tapNext(user);
  await tapNext(user);
};
