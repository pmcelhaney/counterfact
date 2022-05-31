"use strict";

module.exports = () => ({
  assumptions: {},

  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],

  plugins: [],
});
