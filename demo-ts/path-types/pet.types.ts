import type { Context } from "../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
import type { Pet } from "./../components/Pet.js";
import type { Tools } from "./../internal/tools.js";
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
  body: Pet;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/xml": {
          schema: Pet;
        };
        "application/json": {
          schema: Pet;
        };
      };
    };
    405: {
      headers: {};
      content: {};
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/xml";
      body?: Pet;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: Pet;
    }
  | {
      status: 405;
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
  query: undefined;
  path: undefined;
  header: undefined;
  body: Pet;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/xml": {
          schema: Pet;
        };
        "application/json": {
          schema: Pet;
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
    405: {
      headers: {};
      content: {};
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/xml";
      body?: Pet;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: Pet;
    }
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | {
      status: 405;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | { isCounterfactResponse: true };
