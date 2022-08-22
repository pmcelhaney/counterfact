import type { Context } from "../../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
import type { Pet } from "./../../components/Pet.js";
import type { Tools } from "./../../internal/tools.js";
export type HTTP_GET = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: { status?: string };
  path: never;
  header: never;
  body: undefined;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/xml": {
          schema: Array<Pet>;
        };
        "application/json": {
          schema: Array<Pet>;
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
      body?: Array<Pet>;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: Array<Pet>;
    }
  | {
      status: 400;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | { isCounterfactResponse: true };
