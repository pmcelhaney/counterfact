import type { Context } from "../../../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
import type { Order } from "./../../../components/Order.js";
import type { Tools } from "./../../../internal/tools.js";
export type HTTP_GET = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: never;
  path: { orderId: number };
  header: never;
  body: undefined;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/xml": {
          schema: Order;
        };
        "application/json": {
          schema: Order;
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
      body?: Order;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: Order;
    }
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | void;
export type HTTP_DELETE = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: never;
  path: { orderId: number };
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
  | void;
