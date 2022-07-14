import type { Context } from "../../../context/context.js";
import type { Tools } from "./../../../internal/tools.js";
import type { Order } from "./../../../components/Order.js";
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
  | { status: 415; contentType: "text/plain"; body: string };
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
  tools: Tools;
}) =>
  | {
      status: 400;
    }
  | {
      status: 404;
    }
  | { status: 415; contentType: "text/plain"; body: string };
