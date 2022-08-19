import type { HTTP_GET } from "./../../path-types/hello/{name}.types.js";
export const GET: HTTP_GET = ({ path, context, tools }) => {
  const statusCode = tools.oneOf(["default"]);

  if (tools.accepts("application/json")) {
    const example = tools.oneOf(["hello-world"]);

    if (example === "hello-world") {
      return {
        contentType: "application/json",
        body: "Hello, world",
      };
    }

    return {
      contentType: "application/json",
      body: tools.randomFromSchema({ type: "string" }) as string,
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
