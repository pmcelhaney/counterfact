import type { Context } from "../context/context.js";
import type { ResponseBuilderBuilder } from "../../src/types";
import type { Tools } from "./../internal/tools.js";
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
  response: ResponseBuilderBuilder<{
    default: {
      headers: {};
      content: {
        "application/json": {
          schema: string;
        };
      };
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: number | undefined;
      contentType?: "application/json";
      body?: string;
    }
  | { status: 415; contentType: "text/plain"; body: string };
