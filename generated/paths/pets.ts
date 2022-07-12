import type { HTTP_GET } from "./pets.types.js";
import type { HTTP_POST } from "./pets.types.js";
import { PetsSchema } from "./../components/Pets.js";
import { ErrorSchema } from "./../components/Error.js";

export const GET: HTTP_GET = ({ tools }) => {
  const statusCode = tools.oneOf(["200", "default"]);

  if (statusCode === "200") {
    if (tools.accepts("application/json")) {
      const example = tools.oneOf([]);

      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(PetsSchema),
      };
    }
  }
  if (tools.accepts("application/json")) {
    const example = tools.oneOf([]);

    return {
      contentType: "application/json",
      body: tools.randomFromSchema(ErrorSchema),
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
export const POST: HTTP_POST = ({ tools }) => {
  const statusCode = tools.oneOf(["201", "default"]);

  if (statusCode === "201") {
  }
  if (tools.accepts("application/json")) {
    const example = tools.oneOf([]);

    return {
      contentType: "application/json",
      body: tools.randomFromSchema(ErrorSchema),
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
