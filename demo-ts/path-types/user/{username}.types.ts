import type { Context } from "../../context/context.js";
import type { Tools } from "./../../internal/tools.js";
import type { User } from "./../../components/User.js";
export type HTTP_GET = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: never;
  path: { username: string };
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/xml";
      body?: User;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: User;
    }
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string };
export type HTTP_PUT = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: never;
  path: { username: string };
  header: never;
  body: User;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: number | undefined;
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
  path: { username: string };
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string };
