import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryPicker from ".";
import { LanguageProvider } from "../../../../i18n";

afterEach(() => localStorage.clear());

describe("CategoryPicker", () => {
  it("names the category and its type, and opens the sheet", async () => {
    const onOpen = jest.fn();
    render(
      <LanguageProvider>
        <CategoryPicker type="income" name="Freelance" onOpen={onOpen} />
      </LanguageProvider>
    );
    const row = screen.getByRole("button", { name: "Income category: Freelance. Change" });
    expect(row).toHaveTextContent("Income category");
    expect(row).toHaveTextContent("Freelance");
    await userEvent.click(row);
    expect(onOpen).toHaveBeenCalled();
  });
});
