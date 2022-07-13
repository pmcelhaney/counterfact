import type { HTTP_POST } from "./../path-types/pet.types.js";
import type { HTTP_PUT } from "./../path-types/pet.types.js";
import type { Pet } from "./../components/Pet.js";
import { PetSchema } from "./../components/Pet.js";
export const POST: HTTP_POST = ({ body, context, tools }) => {
  const statusCode = tools.oneOf(["200", "405"]);

  if (statusCode === "200") {
    if (tools.accepts("application/xml")) {
      return {
        status: 200,
        contentType: "application/xml",
        body: tools.randomFromSchema(PetSchema) as Pet,
      };
    }
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(PetSchema) as Pet,
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
export const PUT: HTTP_PUT = ({ body, context, tools }) => {
  const statusCode = tools.oneOf(["200", "400", "404", "405"]);

  if (statusCode === "200") {
    if (tools.accepts("application/xml")) {
      return {
        status: 200,
        contentType: "application/xml",
        body: tools.randomFromSchema(PetSchema) as Pet,
      };
    }
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(PetSchema) as Pet,
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
