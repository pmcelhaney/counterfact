import type { HTTP_GET } from "./../../path-types/user/{username}.types.js";
import type { HTTP_PUT } from "./../../path-types/user/{username}.types.js";
import type { HTTP_DELETE } from "./../../path-types/user/{username}.types.js";
import type { User } from "./../../components/User.js";
import { UserSchema } from "./../../components/User.js";
export const GET: HTTP_GET = ({ path, context, tools }) => {
  const statusCode = tools.oneOf(["200", "400", "404"]);

  if (statusCode === "200") {
    if (tools.accepts("application/xml")) {
      return {
        status: 200,
        contentType: "application/xml",
        body: tools.randomFromSchema(UserSchema) as User,
      };
    }
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(UserSchema) as User,
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
export const PUT: HTTP_PUT = ({ path, body, context, tools }) => {
  const statusCode = tools.oneOf(["default"]);

  return {
    status: undefined,
  };

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
