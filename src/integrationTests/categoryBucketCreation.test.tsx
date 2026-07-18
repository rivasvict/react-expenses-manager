import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";

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
    await screen.findByText("Food");
    expect(screen.queryByText("Gym")).not.toBeInTheDocument();

    await user.click(
      await screen.findByRole("link", { name: /add new category/i })
    );
    await user.type(await screen.findByPlaceholderText(/category name/i), "Gym");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Redirected back to the categories list with the freshly created category,
    // flagged as not having a bucket yet.
    const gymEntry = await screen.findByTestId("category-gym");
    expect(gymEntry).toHaveTextContent("Gym");
    expect(gymEntry).toHaveTextContent(/no bucket/i);
  });

  it("a category can later get a bucket by selecting it from the Add bucket form", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym"]));
    const { user } = await renderApp("/add-bucket");

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: "Gym" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Gym" }));
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
    const { user } = await renderApp("/add-category");

    // Create the standalone "Gym" category (no bucket).
    await user.type(await screen.findByPlaceholderText(/category name/i), "Gym");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Land on the categories page, then head to the dashboard to add an expense.
    await screen.findByTestId("category-gym");
    await user.click(await screen.findByRole("link", { name: /home/i }));

    // Now add an expense and file it under the new category.
    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(
      await screen.findByPlaceholderText(/insert expense amount/i),
      "30"
    );
    await user.type(screen.getByPlaceholderText(/description/i), "Monthly pass");

    await user.click(screen.getByRole("combobox"));
    // The brand new category is available as an option even without a bucket.
    expect(await screen.findByRole("option", { name: "Gym" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Gym" }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // The expense shows on the dashboard.
    expect(await screen.findByText("$30.00")).toBeInTheDocument();
  });

  it("rejects a duplicate category name (case-insensitive) and creates nothing", async () => {
    const { user } = await renderApp("/add-category");

    // "food" collides with the seeded "Food" bucket.
    await user.type(await screen.findByPlaceholderText(/category name/i), "food");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);

    // We must still be on the add-category form, and storage must be untouched.
    expect(screen.getByPlaceholderText(/category name/i)).toBeInTheDocument();
    expect(localStorage.getItem("categories")).toBeNull();
  });

  it("rejects an empty category name", async () => {
    const { user } = await renderApp("/add-category");

    await user.click(await screen.findByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot be empty/i);
  });
});
