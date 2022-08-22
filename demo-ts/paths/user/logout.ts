import type { HTTP_GET } from "./../../path-types/user/logout.types.js";
export const GET: HTTP_GET = ({ context, tools }) => {
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
