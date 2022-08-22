import type { HTTP_GET } from "./../../path-types/store/inventory.types.js";
export const GET: HTTP_GET = ({ context, tools }) => {
  const statusCode = tools.oneOf(["200"]);

  if (statusCode === "200") {
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema({
          type: "object",
          required: [],
          properties: {},
        }) as {},
      };
    }
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
