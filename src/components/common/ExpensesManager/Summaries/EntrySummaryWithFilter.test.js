// TODO(#116): This suite never rendered the real component (wrong import
// name/path, unused/typo'd imports) and needs a full rewrite. Skipped for now.
import React from "react";
import EntrySummaryWithFilter from "./EntriesSummaryWithFilter";
import renderer from "react-test-renderer";

describe.skip("EntrySummaryWithFilter", () => {
  it("snapshot: should always render the same component", () => {
    const tree = renderer.create(<EntrySummaryWithFilter />);
  });
});
