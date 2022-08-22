import type { Context } from "../../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
import type { User } from "./../../components/User.js";
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
  path: { username: string };
  header: never;
  body: undefined;
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
    400: {
      headers: {};
      content: {};
    };
    404: {
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
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | { isCounterfactResponse: true };
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
  response: ResponseBuilderBuilder<{
    [statusCode in HttpStatusCode]: {
      headers: {};
      content: {};
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: number | undefined;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | { isCounterfactResponse: true };
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
  response: ResponseBuilderBuilder<{
    400: {
      headers: {};
      content: {};
    };
    404: {
      headers: {};
      content: {};
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | { isCounterfactResponse: true };
