"use strict";

const rules = {
  "@microsoft/sdl/no-html-method": "off",
  "@typescript-eslint/lines-around-comment": "off",
  "@typescript-eslint/naming-convention": "off",
  "import/default": "off",

  "import/namespace": "off",

  "import/prefer-default-export": "off",

  "max-len": [
    "warn",
    {
      code: 120,
      ignorePattern: "eslint|it\\(|describe\\(",
      ignoreTemplateLiterals: true,
    },
  ],

  "n/shebang": "off",

  "no-magic-numbers": [
    "error",
    {
      ignore: [-2, -1, 0, 1, 2],
    },
  ],

  "node/file-extension-in-import": "off",
  "node/no-callback-literal": "off",
  "node/no-missing-import": "off",

  "prettier/prettier": [
    "error",
    {
      endOfLine: "auto",
    },
  ],

  "putout/putout": "off",
};

module.exports = {
  env: {
    es2021: true,
    node: true,
  },

  extends: ["hardcore", "hardcore/ts", "hardcore/node"],

  ignorePatterns: [
    "/node_modules/",
    "/coverage/",
    "/reports/",
    "/out/",
    "_includes",
    ".stryker-tmp",
  ],

  overrides: [
    {
      extends: ["hardcore", "hardcore/node"],
      files: ["*.cjs"],

      parserOptions: {
        sourceType: "script",
      },

      rules: {
        "import/no-commonjs": "off",
      },
    },

    {
      extends: ["hardcore", "hardcore/ts", "hardcore/node", "hardcore/jest"],

      files: ["*.test.js"],

      rules: {
        ...rules,
        "@typescript-eslint/naming-convention": "off",
        "id-length": ["off"],

        "import/unambiguous": "off",

        "jest/prefer-expect-assertions": "off",

        "jest/unbound-method": "off",

        "max-lines": "off",

        "new-cap": [
          "error",
          { capIsNewExceptionPattern: "GET|PUT|POST|DELETE" },
        ],

        "no-magic-numbers": ["off"],
        "node/no-unpublished-import": "off",
      },
    },

    {
      extends: ["hardcore", "hardcore/node"],
      files: ["demo/**/*.js"],

      rules: {
        ...rules,
        "import/no-extraneous-dependencies": "off",
        "import/no-unused-modules": "off",
        "import/prefer-default-export": "off",
        "no-console": "off",
        "no-param-reassign": "off",
        "node/no-unpublished-import": "off",
      },
    },

    {
      extends: ["hardcore", "hardcore/node"],
      files: ["*.cjs"],

      parserOptions: {
        sourceType: "script",
      },

      rules: {
        ...rules,
        "import/no-commonjs": "off",
      },
    },

    {
      extends: ["hardcore", "hardcore/node", "hardcore/ts"],
      files: ["**/*.ts"],

      parserOptions: {
        project: "./tsconfig.eslint.json",
        sourceType: "module",
      },

      rules: {
        ...rules,
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-magic-numbers": "off",
        "@typescript-eslint/prefer-readonly-parameter-types": "off",
        camelcase: "off",
        "eslint-comments/no-unused-disable": "off",
        "etc/prefer-interface": "off",
        "func-style": "off",
        "import/extensions": "off",
        "import/group-exports": "off",
        "import/no-unused-modules": "off",
        "import/prefer-default-export": "off",
        "max-len": "off",
        "n/file-extension-in-import": "off",
        "no-magic-numbers": "off",
        "no-param-reassign": "off",
      },

      settings: {
        "import/parsers": {
          "@typescript-eslint/parser": [".ts", ".tsx"],
        },

        "import/resolver": {
          typescript: {
            alwaysTryTypes: true,
            project: "tsconfig.eslint.json",
          },
        },
      },
    },

    {
      env: {
        es2021: true,
        node: true,
      },

      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],

      files: ["templates/**/*.ts"],

      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },

      rules: {},
    },

    {
      files: ["bin/**.js"],

      rules: {
        ...rules,
        "import/no-unresolved": "off",
        "n/no-missing-import": "off",
      },
    },
  ],

  parserOptions: {
    sourceType: "module",
  },

  rules,
};
