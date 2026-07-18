import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategorySearchSelect, { CategorySearchOption } from "./index";

const OPTIONS: CategorySearchOption[] = [
  { value: ",food,", label: "Food" },
  { value: ",eating out,", label: "Eating out" },
  { value: ",gym,", label: "Gym" },
];

const defaultProps = {
  id: "test-category",
  name: "categories",
  value: "",
  options: OPTIONS,
  emptyOptionLabel: "Select a category",
  onChange: () => {},
};

// Small stateful harness so tests can assert the committed value round-trips
// into the trigger's displayed label, the way real call sites use the control.
const ControlledSelect = ({
  initialValue = "",
  onChange = () => {},
}: {
  initialValue?: string;
  onChange?: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <CategorySearchSelect
      {...defaultProps}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        onChange(newValue);
      }}
    />
  );
};

describe("CategorySearchSelect", () => {
  it("renders closed: trigger shows the empty option label and no options are in the DOM", () => {
    render(<CategorySearchSelect {...defaultProps} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select a category");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("shows the selected option's label on the trigger", () => {
    render(<CategorySearchSelect {...defaultProps} value=",gym," />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Gym");
  });

  it("opens on click, focuses the search input and lists every option plus the empty one", async () => {
    const user = userEvent.setup();
    render(<CategorySearchSelect {...defaultProps} />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByLabelText("Search categories")).toHaveFocus();
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(
      screen.getByRole("option", { name: "Select a category" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Food" })).toBeInTheDocument();
  });

  it("filters options with a case-insensitive substring match as the user types", async () => {
    const user = userEvent.setup();
    render(<CategorySearchSelect {...defaultProps} />);

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("EAT");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Eating out");
    expect(screen.queryByRole("option", { name: "Gym" })).not.toBeInTheDocument();
  });

  it("commits a filtered option on click: fires onChange, closes and updates the trigger label", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<ControlledSelect onChange={handleChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("eat");
    await user.click(screen.getByRole("option", { name: "Eating out" }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(",eating out,");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Eating out");
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("shows an empty state when nothing matches, and Enter commits nothing", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <CategorySearchSelect {...defaultProps} onChange={handleChange} />
    );

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("zzzz");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByText("No matching categories")).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(handleChange).not.toHaveBeenCalled();
    // The panel stays open — nothing was committed.
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("supports full keyboard flow: Enter opens, arrows move the highlight, Enter commits", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<ControlledSelect onChange={handleChange} />);

    screen.getByRole("combobox").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Highlight starts on the (selected) empty option; two ArrowDowns land on
    // the second real option.
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const searchInput = screen.getByLabelText("Search categories");
    expect(searchInput).toHaveAttribute(
      "aria-activedescendant",
      "test-category-option-2"
    );

    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith(",eating out,");
    expect(screen.getByRole("combobox")).toHaveTextContent("Eating out");
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("clamps keyboard navigation at both ends (no wraparound)", async () => {
    const user = userEvent.setup();
    render(<CategorySearchSelect {...defaultProps} />);

    await user.click(screen.getByRole("combobox"));
    const searchInput = screen.getByLabelText("Search categories");

    await user.keyboard("{ArrowUp}");
    expect(searchInput).toHaveAttribute(
      "aria-activedescendant",
      "test-category-option-0"
    );

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(searchInput).toHaveAttribute(
      "aria-activedescendant",
      "test-category-option-3"
    );
  });

  it("closes on Escape without changing the value and refocuses the trigger", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <CategorySearchSelect
        {...defaultProps}
        value=",food,"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Escape}");

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Food");
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("closes when clicking outside without changing the value", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <div>
        <button type="button">Outside</button>
        <CategorySearchSelect {...defaultProps} onChange={handleChange} />
      </div>
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("re-selecting the empty option resets the value back to empty", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<ControlledSelect initialValue=",gym," onChange={handleChange} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Gym");

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Select a category" }));

    expect(handleChange).toHaveBeenCalledWith("");
    expect(screen.getByRole("combobox")).toHaveTextContent("Select a category");
  });

  it("marks the committed value as selected, distinct from the highlight", async () => {
    const user = userEvent.setup();
    render(<CategorySearchSelect {...defaultProps} value=",gym," />);

    await user.click(screen.getByRole("combobox"));

    expect(
      screen.getByRole("option", { name: "Gym" })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("option", { name: "Food" })
    ).toHaveAttribute("aria-selected", "false");
  });
});
