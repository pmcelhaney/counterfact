import type { HTTP_GET } from "./{petId}.types.js";
import { PetSchema } from "./../../components/Pet.js";
import { ErrorSchema } from "./../../components/Error.js";

export const GET: HTTP_GET = ({ tools }) => {
  const statusCode = tools.oneOf(["200", "default"]);

  if (statusCode === "200") {
    if (tools.accepts("application/json")) {
      const example = tools.oneOf([]);

      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(PetSchema),
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
