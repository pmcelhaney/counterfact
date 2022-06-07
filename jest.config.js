/* eslint-disable import/no-anonymous-default-export */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  testEnvironment: "node",
  collectCoverage: true,

  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!**/node_modules/**"],

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: -4,
    },
  },
};
