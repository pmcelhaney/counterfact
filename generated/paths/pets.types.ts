import type { Pets } from "./../components/Pets.js";
import type { Error } from "./../components/Error.js";

export type HTTP_GET = ({ tools: any }) =>
  | {
      status: 200;
      contentType: "application/json";
      body: Pets;
    }
  | {
      status: number | undefined;
      contentType: "application/json";
      body: Error;
    }
  | { status: 415; contentType: "text/plain"; body: string };
export type HTTP_POST = ({ tools: any }) =>
  | {
      status: 201;
      contentType: "contentType";
      body: null;
    }
  | {
      status: number | undefined;
      contentType: "application/json";
      body: Error;
    }
  | { status: 415; contentType: "text/plain"; body: string };
