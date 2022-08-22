import type { Context } from "../../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
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
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/json": {
          schema: { [key: string]: number };
        };
      };
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/json";
      body?: { [key: string]: number };
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | { isCounterfactResponse: true };
