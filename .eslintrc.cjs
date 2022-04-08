"use strict";

module.exports = {
  extends: ["hardcore"],

  env: {
    node: true,
    es2022: true,
  },

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  overrides: [
    {
      files: ["*.cjs"],
      extends: ["hardcore"],

      rules: {
        "import/no-commonjs": "off",
      },

      parserOptions: {
        sourceType: "script",
      },
    },

    {
      files: ["*.test.js"],
      extends: ["hardcore/jest"],

      rules: {
        "import/unambiguous": "off",
        "jest/prefer-expect-assertions": "off",
      },
    },
  ],
};
