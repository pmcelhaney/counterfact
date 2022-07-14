import type { Context } from "../../context/context.js";
import type { Tools } from "./../../internal/tools.js";
import type { Pet } from "./../../components/Pet.js";
export type HTTP_GET = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: never;
  path: { petId: number };
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/xml";
      body?: Pet;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: Pet;
    }
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string };
export type HTTP_POST = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: { name?: number; status?: string };
  path: { petId: number };
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 405;
    }
  | { status: 415; contentType: "text/plain"; body: string };
export type HTTP_DELETE = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: never;
  path: { petId: string };
  header: { api_key?: string };
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 400;
    }
  | { status: 415; contentType: "text/plain"; body: string };
