import type { Context } from "../../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
import type { User } from "./../../components/User.js";
import type { Tools } from "./../../internal/tools.js";
export type HTTP_POST = ({
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
  body: Array<User>;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/xml": {
          schema: User;
        };
        "application/json": {
          schema: User;
        };
      };
    };
    [statusCode in Exclude<HttpStatusCode, 200>]: {
      headers: {};
      content: {};
    };
  }>;
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
      status: number | undefined;
    }
  | { status: 415; contentType: "text/plain"; body: string };
