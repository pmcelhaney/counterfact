import type { HTTP_GET } from "./../path-types/count.types.js";
export const GET: HTTP_GET = ({ context, tools, response }) => {
  const statusCode = tools.oneOf(["default"]);

  return response.default.json("foo")

};
