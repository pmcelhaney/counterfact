"use strict";

module.exports = {
  extends: ["hardcore", "hardcore/ts", "hardcore/node"],

  parserOptions: {
    sourceType: "module",
  },

  rules: {
    "putout/putout": "off",
    "import/prefer-default-export": "off",
    "@typescript-eslint/naming-convention": "off",

    "max-len": [
      "warn",
      {
        ignorePattern: "eslint|it\\(|describe\\(",
        ignoreTemplateLiterals: true,
      },
    ],
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
      files: ["*.test.js"],

      extends: ["hardcore", "hardcore/ts", "hardcore/node", "hardcore/jest"],

      rules: {
        "putout/putout": "off",
        "import/unambiguous": "off",
        "jest/prefer-expect-assertions": "off",

        "new-cap": [
          "error",
          { capIsNewExceptionPattern: "GET|PUT|POST|DELETE" },
        ],

        "@typescript-eslint/naming-convention": "off",

        "max-len": [
          "warn",
          {
            ignorePattern: "eslint|it\\(|describe\\(",
            ignoreTemplateLiterals: true,
          },
        ],
      },
    },
  ],
};
