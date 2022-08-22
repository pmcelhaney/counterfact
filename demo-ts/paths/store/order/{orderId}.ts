import type { HTTP_GET } from "./../../../path-types/store/order/{orderId}.types.js";
import type { HTTP_DELETE } from "./../../../path-types/store/order/{orderId}.types.js";
import type { Order } from "./../../../components/Order.js";
import { OrderSchema } from "./../../../components/Order.js";
export const GET: HTTP_GET = ({ path, context, tools }) => {
  const statusCode = tools.oneOf(["200", "400", "404"]);

  if (statusCode === "200") {
    if (tools.accepts("application/xml")) {
      return {
        status: 200,
        contentType: "application/xml",
        body: tools.randomFromSchema(OrderSchema) as Order,
      };
    }
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(OrderSchema) as Order,
      };
    }
  }
  if (statusCode === "400") {
    return {
      status: 400,
    };
  }
  if (statusCode === "404") {
    return {
      status: 404,
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
export const DELETE: HTTP_DELETE = ({ path, body, context, tools }) => {
  const statusCode = tools.oneOf(["400", "404"]);

  if (statusCode === "400") {
    return {
      status: 400,
    };
  }
  if (statusCode === "404") {
    return {
      status: 404,
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
