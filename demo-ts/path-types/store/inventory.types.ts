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
  query: undefined;
  path: undefined;
  header: undefined;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/json";
      body?: {};
    }
  | { status: 415; contentType: "text/plain"; body: string };
