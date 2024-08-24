import React from "react";
import EntriesSummary from "./EntriesSummary";
import renderer from "react-test-renderer";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { getSumFromEntries } from "../../../.../helpers/entriesHelper";

// Mock the entriesHelper module
jest.mock("../helpers/entriesHelper");

describe("EntriesSummary", () => {
  const entries = [
    {
      amount: 12,
      type: "imcome",
      description: "My description",
      category: "Salary",
    },
    {
      amount: -2,
      type: "expense",
      description: "My description",
      category: "Food",
    },
    {
      amount: -7,
      type: "expense",
      description: "My description",
      category: "Food",
    },
    {
      amount: 12,
      type: "imcome",
      description: "My description",
      category: "Salary",
    },
  ];

  describe("Snapshot: EntriesSummary component", () => {
    it("Should always render same component", () => {
      const tree = renderer.create(<EntriesSummary entries={entries} />);
      const jsDomTree = tree.toJSON();
      expect(jsDomTree).toMatchSnapshot();
    });
  });

  describe("Unit test", () => {
    let container = null;
    let entryComponent = null;
    let totalSumOfEntries = 30;

    beforeEach(() => {
      getSumFromEntries.mockReturnValue(totalSumOfEntries);
      container = document.createElement("div");
      document.body.appendChild(container);

      act(() => {
        entryComponent = render(
          <EntriesSummary entries={entries} />,
          container,
        );
      });
    });

    afterEach(() => {
      getSumFromEntries.mockClear();
      unmountComponentAtNode(container);
      container.remove();
      container = null;
    });

    it("should have the correct total sum rendered in the total div", () => {
      const totalDiv = container.querySelector("div").querySelector("div");
      expect(totalDiv.innerHTML).toBe(`Total: ${totalSumOfEntries}`);
    });

    it("should at least the third element of the entries list", () => {
      const listOfEntries = container.querySelector("ul");
      expect(listOfEntries.children[2].innerHTML).toBe("7 My description Food");
    });

    it("should have valled getSumFromEntries one time with correct entries", () => {
      expect(getSumFromEntries.mock.calls[0][0]).toBe(entries);
    });

    it("should only call the getSumFromEntries function only once", () => {
      expect(getSumFromEntries.mock.calls.length).toBe(1);
    });
  });
});
