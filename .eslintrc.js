export default {
  extends: ["hardcore"],

  env: {
    browser: true,
  },

  overrides: [
    {
      files: ["*.js"],
      extends: ["hardcore/ts-for-js"],
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  ],
};
