import type { Context } from "../../../context/context.js";
import type { ResponseBuilderBuilder } from "counterfact";
import type { HttpStatusCode } from "counterfact";
import type { ApiResponse } from "./../../../components/ApiResponse.js";
import type { Tools } from "./../../../internal/tools.js";
export type HTTP_POST = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: { additionalMetadata?: number };
  path: { petId: number };
  header: never;
  body: undefined;
  context: Context;
  response: ResponseBuilderBuilder<{
    200: {
      headers: {};
      content: {
        "application/json": {
          schema: ApiResponse;
        };
      };
    };
  }>;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/json";
      body?: ApiResponse;
    }
  | { status: 415; contentType: "text/plain"; body: string }
  | void;
