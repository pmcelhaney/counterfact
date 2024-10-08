"use strict";

// Import necessary plugins and parser
const prettierPlugin = require("eslint-plugin-prettier");
const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const jestPlugin = require("eslint-plugin-jest");
const nPlugin = require("eslint-plugin-n");
const promisePlugin = require("eslint-plugin-promise");
const importPlugin = require("eslint-plugin-import");
const regexpPlugin = require("eslint-plugin-regexp");
const securityPlugin = require("eslint-plugin-security");
const espreeParser = require("espree");

module.exports = [
  {
    // General configuration
    ignores: [
      "node_modules/**",
      "coverage/**",
      "reports/**",
      "out/**",
      "dist/**",
      "_includes",
      ".stryker-tmp",
      ".yarn/**",
      "jest.config.js",
      ".eslintrc.cjs",
    ],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
      parser: typescriptParser,
      parserOptions: {
        project: require.resolve("./tsconfig.eslint.json"),
        sourceType: "module",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      prettier: prettierPlugin,
      "@typescript-eslint": typescriptPlugin,
      jest: jestPlugin,
      n: nPlugin,
      promise: promisePlugin,
      import: importPlugin,
      regexp: regexpPlugin,
      security: securityPlugin,
    },
    rules: {
      // Specify rules here
      "@typescript-eslint/lines-around-comment": "off",
      "@typescript-eslint/naming-convention": "off",
      "jest/no-conditional-in-test": "warn",
      "n/no-sync": "warn",
      "promise/avoid-new": "off",
      "import/no-extraneous-dependencies": "off",
      "regexp/prefer-named-capture-group": "warn",
      "security/detect-non-literal-require": "error",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },

  {
    // Configuration for .cjs files
    files: ["*.cjs"],
    ignores: [".yarn"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: require.resolve("./tsconfig.eslint.json"),
        sourceType: "script",
      },
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "import/no-commonjs": "off",
    },
  },
  {
    // Configuration for test files
    files: ["*.test.js", "*.test.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: require.resolve("./tsconfig.eslint.json"),
      },
    },
    rules: {
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-shadow": "off",
      "id-length": "off",
      "import/no-extraneous-dependencies": "off",
      "import/unambiguous": "off",
      "jest/prefer-expect-assertions": "off",
      "jest/unbound-method": "off",
      "max-lines": "off",
      "n/no-extraneous-import": "off",
      "new-cap": ["error", { capIsNewExceptionPattern: "GET|PUT|POST|DELETE" }],
      "no-magic-numbers": "off",
      "no-shadow": "off",
      "node/no-unpublished-import": "off",
    },
  },
  {
    // Configuration for demo files
    files: ["demo/**/*.js"],
    rules: {
      "import/no-extraneous-dependencies": "off",
      "import/no-unused-modules": "off",
      "import/prefer-default-export": "off",
      "no-console": "off",
      "no-param-reassign": "off",
      "node/no-unpublished-import": "off",
    },
  },
  {
    // Configuration for TypeScript files
    files: ["**/*.ts"],
    ignores: ["dist/**", "out/**"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: require.resolve("./tsconfig.eslint.json"),
      },
    },
    rules: {
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
  },
  {
    // Configuration for specific TypeScript templates
    files: ["templates/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
      parserOptions: {
        project: require.resolve("./tsconfig.eslint.json"),
      },
    },
    rules: {},
  },
  {
    // Configuration for bin files
    files: ["bin/**.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: espreeParser,
    },
    rules: {
      "import/no-unresolved": "off",
      "n/no-missing-import": "off",
    },
  },
  {
    files: [".yarn/releases/*.cjs"],
    rules: {
      "node/no-deprecated-api": "off",
    },
  },
];
