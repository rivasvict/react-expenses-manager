import "@testing-library/jest-dom";

// chart.js renders to <canvas> which jsdom cannot paint.
// Replace it with a no-op class so components that mount a chart don't crash.
jest.mock("chart.js/auto", () => ({
  Chart: class {
    constructor() {}
    update() {}
    destroy() {}
  },
}));
