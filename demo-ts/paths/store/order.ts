import type { HTTP_POST } from "./../../path-types/store/order.types.js";
import type { Order } from "./../../components/Order.js";
import { OrderSchema } from "./../../components/Order.js";
export const POST: HTTP_POST = ({ body, context, tools }) => {
  const statusCode = tools.oneOf(["200", "405"]);

  if (statusCode === "200") {
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(OrderSchema) as Order,
      };
    }
  }
  if (statusCode === "405") {
    return {
      status: 405,
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
