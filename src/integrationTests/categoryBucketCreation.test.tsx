import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { selectCategory } from "./helpers/categorySelect";

// Pinned so the navigable month header reads a stable "May 2026".
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  // Start from a small, known set of buckets so assertions stay clean.
  localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("category + bucket creation (issue #100)", () => {
  it("user can create a new category from the Categories context, without creating a bucket", async () => {
    const { user } = await renderApp("/categories");

    // Existing bucket's category is shown; the new one is not there yet.
    await screen.findByRole("button", { name: /^Food/ });
    expect(screen.queryByRole("button", { name: /^Gym/ })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Add expense category" })
    );
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Gym");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    // Back on the list with the freshly created category, unused and without
    // a bucket.
    expect(
      await screen.findByRole("button", { name: /^Gym/ })
    ).toHaveTextContent(/^Gym\s*Not used yet/);
  });

  it("a category can later get a bucket by selecting it from the Add bucket form", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym"]));
    const { user } = await renderApp("/add-bucket");

    await selectCategory(user, "Gym");
    await user.type(
      screen.getByPlaceholderText(/insert bucket allowance/i),
      "120"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Redirected back to the buckets list with the freshly bucketed category.
    expect(await screen.findByText("Gym")).toBeInTheDocument();
    expect(screen.getByTestId("bucket-gym-remaining").textContent).toBe(
      "Remaining: $120.00"
    );
  });

  it("a newly created category becomes selectable when adding an expense, even without a bucket", async () => {
    const { user } = await renderApp("/categories");

    // Create the standalone "Gym" category (no bucket).
    await user.click(
      await screen.findByRole("button", { name: "Add expense category" })
    );
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Gym");
    await user.click(screen.getByRole("button", { name: "Create category" }));
    await screen.findByRole("button", { name: /^Gym/ });

    // Head to the dashboard to add an expense.
    await user.click(await screen.findByRole("link", { name: /home/i }));
    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(
      await screen.findByPlaceholderText(/insert expense amount/i),
      "30"
    );
    await user.type(screen.getByPlaceholderText(/description/i), "Monthly pass");

    // The brand new category is available as an option even without a bucket;
    // selectCategory's internal option lookup fails the test if it is missing.
    await selectCategory(user, "Gym");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // The expense shows on the dashboard.
    expect(await screen.findByText("$30.00")).toBeInTheDocument();
  });

  it("rejects a duplicate category name (case-insensitive) and creates nothing", async () => {
    const { user } = await renderApp("/categories");

    // "food" collides with the "Food" category.
    await user.click(
      await screen.findByRole("button", { name: "Add expense category" })
    );
    await user.type(screen.getByRole("textbox", { name: "Name" }), "food");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An expense category called “food” already exists."
    );
    // The sheet stays open, and the list still has a single Food.
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^food/i })).toHaveLength(1);
  });

  it("rejects an empty category name", async () => {
    const { user } = await renderApp("/categories");

    await user.click(
      await screen.findByRole("button", { name: "Add expense category" })
    );
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot be empty/i);
  });

  it("rejects a negative allowance and creates nothing", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym"]));
    const { user } = await renderApp("/add-bucket");

    await selectCategory(user, "Gym");
    await user.type(
      screen.getByPlaceholderText(/insert bucket allowance/i),
      "-50"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/greater than zero/i);

    // We must still be on the add-bucket form, and storage must be untouched.
    expect(screen.getByPlaceholderText(/insert bucket allowance/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("buckets") || "{}")).toEqual({
      Food: 200,
    });
  });

  it("rejects a zero allowance and creates nothing", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym"]));
    const { user } = await renderApp("/add-bucket");

    await selectCategory(user, "Gym");
    await user.type(
      screen.getByPlaceholderText(/insert bucket allowance/i),
      "0"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/greater than zero/i);

    // We must still be on the add-bucket form, and storage must be untouched.
    expect(screen.getByPlaceholderText(/insert bucket allowance/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("buckets") || "{}")).toEqual({
      Food: 200,
    });
  });
});
