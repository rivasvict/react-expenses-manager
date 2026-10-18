import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, OCTOBER } from "./helpers/seed";
import {
  addOwnCategory,
  findStepHeading,
  setBucketLimit,
  tapBack,
  tapNext,
  toggleChip,
  walkToReviewEmpty,
} from "./helpers/onboarding";

/**
 * The first-run wizard for brand-new users (design/features/new-user-onboarding/
 * ui/decision.md): who sees it, its five steps, what Start tracking saves and
 * what Skip setup leaves empty.
 */

const PINNED_DATE = new Date("2026-10-15T12:00:00");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

const openNavLink = async (user: Awaited<ReturnType<typeof renderApp>>["user"], name: string) =>
  user.click(await screen.findByRole("link", { name }));

describe("who sees the wizard", () => {
  it("shows it to a user with no data, on its own screen", async () => {
    await renderApp("/", { newUser: true });

    expect(await findStepHeading("Welcome! Let’s set things up")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("sends any route to the wizard while the user is new", async () => {
    await renderApp("/buckets", { newUser: true });

    expect(await findStepHeading("Welcome! Let’s set things up")).toBeInTheDocument();
  });

  it("does not show it to a user who already has entries", async () => {
    seedEntries([
      {
        description: "Pay",
        amount: "100",
        type: "income",
        categories_path: ",salary,",
        date: ts(2026, OCTOBER, 3),
      },
    ]);
    await renderApp("/", { newUser: true });

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
    expect(screen.queryByText("Step 1 of 5")).not.toBeInTheDocument();
  });

  it("does not show it to a user whose device already has category lists", async () => {
    localStorage.setItem(
      "categoryLists",
      JSON.stringify({ expense: ["Food"], income: [] })
    );
    await renderApp("/", { newUser: true });

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
  });

  it("keeps /welcome away from a user who has finished or skipped it", async () => {
    await renderApp("/welcome");

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
    expect(screen.queryByText("Step 1 of 5")).not.toBeInTheDocument();
  });
});

describe("finishing the wizard", () => {
  it("lets a user finish with no categories and no buckets", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await walkToReviewEmpty(user);

    expect(await findStepHeading("All set")).toBeInTheDocument();
    expect(screen.getByText("No expense categories")).toBeInTheDocument();
    expect(screen.getByText("No income categories")).toBeInTheDocument();
    expect(screen.getByText("No buckets")).toBeInTheDocument();

    await tapNext(user, "Start tracking");
    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();

    await openNavLink(user, "Categories");
    expect(await screen.findByText("No expense categories yet")).toBeInTheDocument();

    await openNavLink(user, "Buckets");
    expect(await screen.findByText(/no buckets yet/i)).toBeInTheDocument();
  });

  it("saves the chosen and own categories and a bucket for one of them", async () => {
    const { user } = await renderApp("/", { newUser: true });

    await tapNext(user);
    await findStepHeading("What do you spend on?");
    await toggleChip(user, "Food");
    await toggleChip(user, "Eating out");
    await addOwnCategory(user, "Pet food");
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    await tapNext(user);

    await findStepHeading("Where does money come in?");
    await toggleChip(user, "Salary");
    await addOwnCategory(user, "Freelance");
    await tapNext(user);

    await findStepHeading(/Set monthly limits/);
    await setBucketLimit(user, "Food", "450");
    expect(screen.getByText("1 bucket · $450.00 a month")).toBeInTheDocument();
    await tapNext(user);

    await findStepHeading("All set");
    expect(screen.getByText("3 expense categories")).toBeInTheDocument();
    expect(screen.getByText("Your own: Pet food")).toBeInTheDocument();
    expect(screen.getByText("2 income categories")).toBeInTheDocument();
    expect(screen.getByText("1 bucket")).toBeInTheDocument();
    await tapNext(user, "Start tracking");

    await screen.findByText("Monthly Balance");
    await openNavLink(user, "Categories");
    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Pet food")).toBeInTheDocument();
    expect(screen.queryByText("Laundry")).not.toBeInTheDocument();

    await openNavLink(user, "Buckets");
    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.queryByText("Eating out")).not.toBeInTheDocument();
  });

  it("applies the chosen currency and Privacy mode when finishing", async () => {
    const { user } = await renderApp("/", { newUser: true });

    await user.click(await screen.findByRole("radio", { name: "Euro" }));
    await user.click(screen.getByRole("switch", { name: /Privacy mode/ }));
    await walkToReviewEmpty(user);

    expect(screen.getByText("English · € EUR")).toBeInTheDocument();
    expect(screen.getByText("Privacy mode on")).toBeInTheDocument();
    await tapNext(user, "Start tracking");

    await screen.findByText("Monthly Balance");
    await openNavLink(user, "Settings");
    expect(await screen.findByRole("button", { name: /^Currency/ })).toHaveTextContent("€ · EUR");
    expect(screen.getByRole("switch", { name: /^Privacy mode/ })).toBeChecked();
  });

  it("shows nothing chosen on the Buckets step when no expense category was chosen", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);
    await tapNext(user);
    await tapNext(user);

    expect(await screen.findByText("No expense categories to budget")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });
});

describe("the categories steps", () => {
  it("starts with nothing chosen and says that is fine", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);

    expect(await screen.findByText("0 of 29 selected")).toBeInTheDocument();
    expect(screen.getByText("0 selected · none is fine")).toBeInTheDocument();
    expect(screen.getByText(/Starting with none is fine/)).toBeInTheDocument();
  });

  it("selects all and clears", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);

    await user.click(await screen.findByRole("button", { name: "Select all" }));
    expect(screen.getByText("29 of 29 selected")).toBeInTheDocument();
    expect(screen.getByText("29 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("0 of 29 selected")).toBeInTheDocument();
  });

  it("keeps the expense and income lists apart and allows the same own name in both", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);
    await addOwnCategory(user, "Gifts");
    await tapNext(user);

    await addOwnCategory(user, "Gifts");
    expect(screen.getByRole("button", { name: "Gifts" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains a duplicate name and keeps the user on the step", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);

    await addOwnCategory(user, "food");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An expense category called “food” already exists."
    );
    expect(screen.getByRole("button", { name: "Food" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not add an empty name", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);

    await user.click(await screen.findByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Category name cannot be empty");
  });
});

describe("the buckets step", () => {
  const reachBuckets = async (user: Awaited<ReturnType<typeof renderApp>>["user"]) => {
    await tapNext(user);
    await toggleChip(user, "Food");
    await tapNext(user);
    await tapNext(user);
    await findStepHeading(/Set monthly limits/);
  };

  it("lists the chosen expense categories, each with an optional limit", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await reachBuckets(user);

    expect(screen.getByRole("checkbox", { name: "Food" })).not.toBeChecked();
    await setBucketLimit(user, "Food", "20");
    expect(screen.getByRole("checkbox", { name: "Food" })).toBeChecked();
  });

  it("blocks Next when a ticked category has a limit of zero", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await reachBuckets(user);

    await setBucketLimit(user, "Food", "0");
    await tapNext(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Allowance must be greater than zero"
    );
    expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Monthly limit for Food" }));
    await tapNext(user);
    expect(await findStepHeading("All set")).toBeInTheDocument();
  });
});

describe("moving around", () => {
  it("keeps the draft when going back", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);
    await toggleChip(user, "Food");
    await tapNext(user);
    await tapBack(user);

    expect(await screen.findByRole("button", { name: "Food" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("returns straight to the review after editing a section from it", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await walkToReviewEmpty(user);

    await user.click(await screen.findByRole("button", { name: "Edit No expense categories" }));
    await findStepHeading("What do you spend on?");
    await toggleChip(user, "Food");
    await tapNext(user);

    expect(await findStepHeading("All set")).toBeInTheDocument();
    expect(screen.getByText("1 expense category")).toBeInTheDocument();
  });

  it("drops a limit when its category is no longer chosen", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await tapNext(user);
    await toggleChip(user, "Food");
    await tapNext(user);
    await tapNext(user);
    await setBucketLimit(user, "Food", "50");
    await tapBack(user);
    await tapBack(user);
    await toggleChip(user, "Food");
    await tapNext(user);
    await tapNext(user);

    expect(await screen.findByText("No expense categories to budget")).toBeInTheDocument();
  });
});

describe("Skip setup", () => {
  it("leaves the wizard at once, keeping only the language", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await user.click(await screen.findByRole("radio", { name: "Español" }));
    expect(await findStepHeading("¡Te damos la bienvenida! Vamos a configurarlo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Omitir configuración" }));

    expect(await screen.findByText("Balance mensual")).toBeInTheDocument();
    expect(screen.queryByText(/Paso 1 de 5/)).not.toBeInTheDocument();
  });

  it("leaves no categories and no buckets, not the default list", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await user.click(await screen.findByRole("button", { name: "Skip setup" }));

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
    await openNavLink(user, "Categories");
    expect(await screen.findByText("No expense categories yet")).toBeInTheDocument();
    expect(screen.queryByText("Food")).not.toBeInTheDocument();

    await openNavLink(user, "Buckets");
    expect(await screen.findByText(/no buckets yet/i)).toBeInTheDocument();
  });

  it("does not ask for the wizard again after skipping", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await user.click(await screen.findByRole("button", { name: "Skip setup" }));

    expect(await screen.findByText("Monthly Balance")).toBeInTheDocument();
    expect(screen.queryByText("Step 1 of 5")).not.toBeInTheDocument();
  });
});

describe("in Spanish", () => {
  it("runs the whole wizard in the chosen language", async () => {
    const { user } = await renderApp("/", { newUser: true });
    await user.click(await screen.findByRole("radio", { name: "Español" }));
    await tapNext(user, "Siguiente");

    expect(await findStepHeading("¿En qué gastas?")).toBeInTheDocument();
    expect(screen.getByText("Paso 2 de 5")).toBeInTheDocument();
    expect(screen.getByText("0 de 29 elegidas")).toBeInTheDocument();
    await tapNext(user, "Siguiente");
    expect(await findStepHeading("¿De dónde entra el dinero?")).toBeInTheDocument();
    await tapNext(user, "Siguiente");
    expect(await screen.findByText("No hay categorías de gasto que presupuestar")).toBeInTheDocument();
    await tapNext(user, "Siguiente");
    expect(await findStepHeading("Todo listo")).toBeInTheDocument();
    expect(screen.getByText("Sin categorías de gasto")).toBeInTheDocument();
  });
});
