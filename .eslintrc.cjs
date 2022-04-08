"use strict";

module.exports = {
  extends: ["hardcore", "hardcore/ts", "hardcore/node"],

  parserOptions: {
    project: "./tsconfig.json",
  },

  rules: {
    "import/prefer-default-export": "off",
    "@typescript-eslint/naming-convention": "off",
  },

  overrides: [
    {
      files: ["*.cjs"],
      extends: ["hardcore", "hardcore/node"],

      rules: {
        "import/no-commonjs": "off",
      },

      parserOptions: {
        sourceType: "script",
      },
    },

    {
      files: ["*.test.ts"],

      extends: ["hardcore", "hardcore/ts", "hardcore/node", "hardcore/jest"],

      rules: {
        "import/unambiguous": "off",
        "jest/prefer-expect-assertions": "off",

        "new-cap": [
          "error",
          { capIsNewExceptionPattern: "GET|PUT|POST|DELETE" },
        ],

        "@typescript-eslint/naming-convention": "off",
      },
    },
  ],
};
