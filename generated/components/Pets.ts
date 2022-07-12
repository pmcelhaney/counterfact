import type { Pet } from "./Pet.js";
import { PetSchema } from "./Pet.js";

export type Pets = Array<Pet>;
export const PetsSchema = {
  type: "array",
  items: PetSchema,
};
