import type { createPet } from "../types/paths/pets.types.js";

export function POST($: Parameters<createPet>[0]) {
  return $.response[201].json($.context.add($.body));
}
