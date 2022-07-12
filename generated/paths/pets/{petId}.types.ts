import type { Pet } from "./../../components/Pet.js";
import type { Error } from "./../../components/Error.js";

export type HTTP_GET = ({ tools: any }) =>
  | {
      status: 200;
      contentType: "application/json";
      body: Pet;
    }
  | {
      status: number | undefined;
      contentType: "application/json";
      body: Error;
    }
  | { status: 415; contentType: "text/plain"; body: string };
