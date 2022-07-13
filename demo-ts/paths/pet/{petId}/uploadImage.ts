import type { HTTP_POST } from "./../../../path-types/pet/{petId}/uploadImage.types.js";
import type { ApiResponse } from "./../../../components/ApiResponse.js";
import { ApiResponseSchema } from "./../../../components/ApiResponse.js";
export const POST: HTTP_POST = ({ path, query, body, context, tools }) => {
  const statusCode = tools.oneOf(["200"]);

  if (statusCode === "200") {
    if (tools.accepts("application/json")) {
      return {
        status: 200,
        contentType: "application/json",
        body: tools.randomFromSchema(ApiResponseSchema) as ApiResponse,
      };
    }
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
