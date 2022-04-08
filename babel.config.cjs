"use strict";

module.exports = (api) => {
  const isJest = api.env("test");

  const config = {
    assumptions: {},

    presets: [
      "@babel/preset-typescript",
      ["@babel/preset-env", { targets: { node: "current" } }],
    ],

    plugins: [],
  };

  // https://jestjs.io/docs/getting-started#using-typescript
  if (isJest) {
    config.plugins.push(
      ["@babel/plugin-proposal-decorators", { decoratorsBeforeExport: true }],
      "@babel/plugin-proposal-class-properties"
    );
  }

  return config;
};
