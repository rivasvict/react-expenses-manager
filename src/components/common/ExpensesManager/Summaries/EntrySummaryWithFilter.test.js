// TODO(#116): This suite imports "./EntrySummaryWithFilter", but the real
// component lives at "EntriesSummaryWithFilter/" (different name/path) and
// doesn't even parse against anything real. Needs a full rewrite.
import React from "react";
import EntrySummaryWithFilter from "./EntrySummaryWithFilter";
import { rennder, unmountComponentAtNode } from "react-dom";
import renderer from "react-test-renderer";
import { isTSAnyKeyword } from "@babel/types";

describe("EntrySummaryWithFilter", () => {
  it("snapshot: should always render the same component", () => {
    const tree = renderer.create(<EntrySummaryWithFilter />);
  });
});
