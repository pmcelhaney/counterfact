import type { Context } from "../../context/context.js";
import type { Tools } from "./../../internal/tools.js";
export type HTTP_GET = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: { username?: string; password?: string };
  path: never;
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/xml";
      body?: string;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: string;
    }
  | {
      status: 400;
    }
  | { status: 415; contentType: "text/plain"; body: string };
