import type { HTTP_POST } from "./../path-types/user.types.js";
import type { User } from "./../components/User.js";
import { UserSchema } from "./../components/User.js";
export const POST: HTTP_POST = ({ body, context, tools }) => {
  const statusCode = tools.oneOf(["default"]);

  if (tools.accepts("application/json")) {
    return {
      contentType: "application/json",
      body: tools.randomFromSchema(UserSchema) as User,
    };
  }
  if (tools.accepts("application/xml")) {
    return {
      contentType: "application/xml",
      body: tools.randomFromSchema(UserSchema) as User,
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
