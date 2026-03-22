import type { helloKitty } from "../../types/paths/hello/kitty.types.js";

export const GET: helloKitty = async ($) => {
  return $.response[200].random();
};
