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
  it("user can create a new bucket and see it on the buckets page", async () => {
    const { user } = await renderApp("/buckets");

    // Existing bucket is shown; the new one is not there yet.
    await screen.findByText("Food");
    expect(screen.queryByText("Gym")).not.toBeInTheDocument();

    await user.click(await screen.findByRole("link", { name: /add new bucket/i }));

    await user.type(await screen.findByPlaceholderText(/category name/i), "Gym");
    await user.type(
      screen.getByPlaceholderText(/insert bucket allowance/i),
      "120"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Redirected back to the buckets list with the freshly created bucket.
    expect(await screen.findByText("Gym")).toBeInTheDocument();
    expect(screen.getByTestId("bucket-gym-availability").textContent).toBe(
      "$120.00"
    );
  });

  it("a newly created category becomes selectable when adding an expense", async () => {
    const { user } = await renderApp("/add-bucket");

    // Create the "Gym" category/bucket.
    await user.type(await screen.findByPlaceholderText(/category name/i), "Gym");
    await user.type(
      screen.getByPlaceholderText(/insert bucket allowance/i),
      "120"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Land on the buckets page, then head to the dashboard to add an expense.
    await screen.findByText("Gym");
    await user.click(await screen.findByRole("link", { name: /home/i }));

    // Now add an expense and file it under the new category.
    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(
      await screen.findByPlaceholderText(/insert expense amount/i),
      "30"
    );
    await user.type(screen.getByPlaceholderText(/description/i), "Monthly pass");

    const categorySelect = screen.getByRole("combobox");
    // The brand new category is available as an option.
    expect(
      screen.getByRole("option", { name: "Gym" })
    ).toBeInTheDocument();
    await user.selectOptions(categorySelect, "Gym");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // The expense shows on the dashboard...
    expect(await screen.findByText("$30.00")).toBeInTheDocument();

    // ...and is reflected as spending against the Gym bucket.
    await user.click(await screen.findByRole("link", { name: /buckets/i }));
    expect(await screen.findByText("Gym")).toBeInTheDocument();
    expect(screen.getByTestId("bucket-gym-spending").textContent).toBe(
      "$30.00"
    );
  });

  it("rejects a duplicate category name (case-insensitive) and creates nothing", async () => {
    const { user } = await renderApp("/add-bucket");

    // "food" collides with the seeded "Food" bucket.
    await user.type(await screen.findByPlaceholderText(/category name/i), "food");
    await user.type(
      screen.getByPlaceholderText(/insert bucket allowance/i),
      "50"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);

    // We must still be on the add-bucket form, and storage must be untouched.
    expect(screen.getByPlaceholderText(/category name/i)).toBeInTheDocument();
    const storedBuckets = JSON.parse(localStorage.getItem("buckets") as string);
    expect(Object.keys(storedBuckets)).toEqual(["Food"]);
  });

  it("rejects an empty category name", async () => {
    const { user } = await renderApp("/add-bucket");

    await user.type(
      await screen.findByPlaceholderText(/insert bucket allowance/i),
      "50"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot be empty/i);
  });
});
