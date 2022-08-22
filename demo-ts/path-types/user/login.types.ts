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
  query: { username?: string; password?: string };
  path: never;
  header: never;
  body: undefined;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/xml": {
          schema: string;
        };
        "application/json": {
          schema: string;
        };
      };
    };
    400: {
      headers: {};
      content: {};
    };
  }>;
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
  | { status: 415; contentType: "text/plain"; body: string }
  | void;
