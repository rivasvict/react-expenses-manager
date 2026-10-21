import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HistoryNotice from ".";

describe("HistoryNotice", () => {
  it("shows the title and the explanation", () => {
    render(<HistoryNotice title="Not enough history" body="Keep adding entries." />);
    expect(screen.getByText("Not enough history")).toBeInTheDocument();
    expect(screen.getByText("Keep adding entries.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers its action when there is one", async () => {
    const onClick = jest.fn();
    render(
      <HistoryNotice title="t" body="b" action={{ label: "Compare with July 2026", onClick }} />
    );
    await userEvent.click(screen.getByRole("button", { name: "Compare with July 2026" }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("HistoryNotice options", () => {
  it("can show a secondary action and an icon", () => {
    render(
      <HistoryNotice
        title="t"
        body="b"
        icon={<span data-testid="mark" />}
        action={{ label: "Choose another category", onClick: jest.fn(), variant: "secondary" }}
      />
    );
    expect(screen.getByTestId("mark")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose another category" })).toHaveClass("btn-secondary");
  });
});
