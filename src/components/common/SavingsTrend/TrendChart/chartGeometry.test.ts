import {
  CHART,
  getChartGeometry,
  getNearestIndex,
  getTickIndexes,
} from "./chartGeometry";

describe("getChartGeometry", () => {
  it("spreads the points evenly between the side paddings", () => {
    const { xs } = getChartGeometry([100, 200, 150]);
    expect(xs).toEqual([8, 150, 292]);
  });

  it("puts a higher value higher up (a smaller y)", () => {
    const { ys } = getChartGeometry([100, 300, 200]);
    expect(ys[1]).toBeLessThan(ys[2]);
    expect(ys[2]).toBeLessThan(ys[0]);
  });

  it("keeps the baseline at the first point's height", () => {
    const { ys, baselineY } = getChartGeometry([120, 500, -40]);
    expect(baselineY).toBe(ys[0]);
  });

  it("keeps every point inside the top and bottom padding", () => {
    const { ys } = getChartGeometry([-180, 1620, 820]);
    ys.forEach((y) => {
      expect(y).toBeGreaterThan(CHART.paddingTop);
      expect(y).toBeLessThan(CHART.height - CHART.paddingBottom);
    });
  });

  it("does not divide by zero when every value is the same", () => {
    const { ys } = getChartGeometry([500, 500, 500]);
    expect(ys.every((y) => Number.isFinite(y))).toBe(true);
  });

  it("handles a single point", () => {
    expect(getChartGeometry([10]).xs).toEqual([8]);
  });
});

describe("getTickIndexes", () => {
  it("labels every point when there are few", () => {
    expect(getTickIndexes(7, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(getTickIndexes(2, 7)).toEqual([0, 1]);
  });

  it("spreads the labels evenly, always including the first and the last", () => {
    expect(getTickIndexes(13, 7)).toEqual([0, 2, 4, 6, 8, 10, 12]);
    expect(getTickIndexes(13, 5)).toEqual([0, 3, 6, 9, 12]);
    expect(getTickIndexes(40, 5).slice(-1)).toEqual([39]);
  });
});

describe("getNearestIndex", () => {
  it("finds the closest point", () => {
    expect(getNearestIndex(10, [8, 150, 292])).toBe(0);
    expect(getNearestIndex(140, [8, 150, 292])).toBe(1);
    expect(getNearestIndex(400, [8, 150, 292])).toBe(2);
  });
});
