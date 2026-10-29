// Unit and integration tests (`npm test`). Mirrors the Jest setup Create
// React App used to provide, so the suites under src/ run unchanged.
module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/config/jest/env.js"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
  ],
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
      },
    ],
    // Images and other assets import as their file name, as under CRA.
    "^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|scss|json)$)":
      "<rootDir>/config/jest/fileTransform.js",
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/config/jest/styleMock.js",
  },
  // @iconify-icons ships ES modules, so it is compiled like app code.
  transformIgnorePatterns: ["/node_modules/(?!@iconify-icons/)"],
  // CRA's default: every mock's calls and implementation reset between tests.
  resetMocks: true,
};
