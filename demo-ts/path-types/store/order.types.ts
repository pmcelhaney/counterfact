import type { Context } from "../../context/context.js";
import type { Order } from "./../../components/Order.js";
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
  body: Order;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/json";
      body?: Order;
    }
  | {
      status: 405;
    }
  | { status: 415; contentType: "text/plain"; body: string };
