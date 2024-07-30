// eslint-disable-next-line import/no-anonymous-default-export
export default {
  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/*.d.ts",
  ],

  coverageProvider: "v8",

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 77,
      statements: 77,
    },
  },

  extensionsToTreatAsEsm: [".ts", ".mts"],

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  testEnvironment: "node",

  testTimeout: 10_000,

  transform: {
    "^.+\\.(t|j|mj)s?$": "@swc/jest",
  },
};
