"use strict";

const path = require("path");

const js = require("@eslint/js");
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

const jestRecommended = jestPlugin.configs["flat/recommended"];
const typescriptFiles = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];
const typescriptRecommended = typescriptPlugin.configs["flat/recommended"].map(
  (config) => ({
    ...config,
    files: typescriptFiles,
  }),
);

module.exports = [
  {
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
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  js.configs.recommended,
  ...nPlugin.configs["flat/mixed-esm-and-cjs"],
  promisePlugin.configs["flat/recommended"],
  importPlugin.flatConfigs.recommended,
  regexpPlugin.configs["flat/recommended"],
  securityPlugin.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  ...typescriptRecommended,
  {
    files: typescriptFiles,
    plugins: {
      n: nPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
    },
  },
  {
    files: typescriptFiles,
    ...importPlugin.flatConfigs.typescript,
  },
  {
    files: ["*.cjs"],
    rules: {
      "import/no-commonjs": "off",
    },
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "import/no-extraneous-dependencies": "off",
      "promise/avoid-new": "off",
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
    files: ["**/*.test.js", "**/*.test.ts"],
    plugins: jestRecommended.plugins,
    languageOptions: {
      ...jestRecommended.languageOptions,
      parser: typescriptParser,
    },
    rules: {
      ...jestRecommended.rules,
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-shadow": "off",
      "id-length": "off",
      "import/no-extraneous-dependencies": "off",
      "import/unambiguous": "off",
      "jest/no-conditional-in-test": "warn",
      "jest/prefer-expect-assertions": "off",
      "jest/unbound-method": "off",
      "max-lines": "off",
      "new-cap": ["error", { capIsNewExceptionPattern: "GET|PUT|POST|DELETE" }],
      "no-magic-numbers": "off",
      "no-shadow": "off",
    },
  },
  {
    files: ["demo/**/*.js"],
    rules: {
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "no-console": "off",
      "no-param-reassign": "off",
    },
  },
  {
    files: typescriptFiles,
    ignores: ["dist/**", "out/**"],
    rules: {
      "@typescript-eslint/lines-around-comment": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/prefer-readonly-parameter-types": "off",
      camelcase: "off",
      "eslint-comments/no-unused-disable": "off",
      "etc/prefer-interface": "off",
      "func-style": "off",
      "import/extensions": "off",
      "import/group-exports": "off",
      "import/no-extraneous-dependencies": "off",
      "import/no-unresolved": "off",
      "import/prefer-default-export": "off",
      "max-len": "off",
      "no-magic-numbers": "off",
      "no-param-reassign": "off",
      "promise/avoid-new": "off",
      "regexp/prefer-named-capture-group": "warn",
      "security/detect-non-literal-require": "error",
    },
  },
  {
    files: [...typescriptFiles, "**/*.cjs"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },
  {
    files: ["**/*.test-d.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["eslint.config.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {
      "import/no-commonjs": "off",
      "n/no-extraneous-require": "off",
    },
  },
  {
    files: ["jest.config.js"],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: ["templates/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
    },
    rules: {},
  },
  {
    files: ["bin/**/*.js"],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: "module",
      parser: espreeParser,
    },
    rules: {
      "import/no-unresolved": "off",
      "n/no-missing-import": "off",
      "n/no-process-exit": "off",
    },
  },
  {
    files: [".yarn/releases/*.cjs"],
    rules: {
      "n/no-deprecated-api": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx,js,cjs,mjs}", "test/**/*.{ts,tsx,js,cjs,mjs}"],
    plugins: {
      "filename-rules": {
        rules: {
          "kebab-case": {
            create(context) {
              return {
                Program() {
                  const filename = context.filename;
                  const basename = path
                    .basename(filename)
                    .replace(/\..*$/u, "");

                  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(basename)) {
                    context.report({
                      loc: { line: 1, column: 0 },
                      message: `Filename '${basename}' must be kebab-case.`,
                    });
                  }
                },
              };
            },
          },
        },
      },
    },
    rules: {
      "filename-rules/kebab-case": "error",
    },
  },
];
