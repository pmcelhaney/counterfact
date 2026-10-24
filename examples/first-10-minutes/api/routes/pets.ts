import type { createPet } from "../types/paths/pets.types.js";

export const POST: createPet = function ($) {
  return $.response[201].json($.context.add($.body));
};
