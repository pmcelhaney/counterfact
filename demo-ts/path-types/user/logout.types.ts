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
  query: never;
  path: never;
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: number | undefined;
    }
  | { status: 415; contentType: "text/plain"; body: string };
