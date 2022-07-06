"use strict";

const rules = {
  "putout/putout": "off",
  "import/prefer-default-export": "off",
  "@typescript-eslint/naming-convention": "off",

  "max-len": [
    "warn",
    {
      ignorePattern: "eslint|it\\(|describe\\(",
      ignoreTemplateLiterals: true,
      code: 120,
    },
  ],

  "no-magic-numbers": [
    "error",
    {
      ignore: [-1, 0, 1],
    },
  ],
};

module.exports = {
  ignorePatterns: ["/node_modules/", "/coverage/", "/reports/"],

  extends: ["hardcore", "hardcore/ts", "hardcore/node"],

  parserOptions: {
    sourceType: "module",
  },

  rules,

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
        ...rules,
        "import/unambiguous": "off",
        "jest/prefer-expect-assertions": "off",

        "new-cap": [
          "error",
          { capIsNewExceptionPattern: "GET|PUT|POST|DELETE" },
        ],

        "@typescript-eslint/naming-convention": "off",

        "node/no-unpublished-import": "off",

        "no-magic-numbers": ["off"],
        "id-length": ["off"],
      },
    },

    {
      files: ["demo/**/*.js"],
      extends: ["hardcore", "hardcore/node"],

      rules: {
        ...rules,
        "import/no-extraneous-dependencies": "off",
        "import/no-unused-modules": "off",
        "import/prefer-default-export": "off",
        "no-param-reassign": "off",
        "no-console": "off",
        "node/no-unpublished-import": "off",
      },
    },

    {
      files: ["*.cjs"],
      extends: ["hardcore", "hardcore/node"],

      rules: {
        ...rules,
        "import/no-commonjs": "off",
      },

      parserOptions: {
        sourceType: "script",
      },
    },

    {
      files: ["demo-ts/**/*.ts"],
      extends: ["hardcore", "hardcore/node", "hardcore/ts"],

      parserOptions: {
        sourceType: "module",
        project: "./demo-ts/tsconfig.json",
      },

      rules: {
        ...rules,
        "import/prefer-default-export": "off",
        "import/no-unused-modules": "off",
        "func-style": "off",
        camelcase: "off",
        "@typescript-eslint/naming-convention": "off",
        "no-magic-numbers": "off",
        "no-param-reassign": "off",
        "import/group-exports": "off",
        "max-len": "off",
        "etc/prefer-interface": "off",
        "@typescript-eslint/prefer-readonly-parameter-types": "off",
        "eslint-comments/no-unused-disable": "off",
      },
    },
  ],
};
