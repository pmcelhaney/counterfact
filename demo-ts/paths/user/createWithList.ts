import type { HTTP_POST } from "./../../path-types/user/createWithList.types.js";
import type { User } from "./../../components/User.js";
import { UserSchema } from "./../../components/User.js";
export const POST: HTTP_POST = ({ body, context, tools }) => {
  const statusCode = tools.oneOf(["200", "default"]);

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
  return {
    status: undefined,
  };

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
