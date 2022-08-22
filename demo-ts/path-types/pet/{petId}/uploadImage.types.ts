import type { Context } from "../../../context/context.js";
import type { Tools } from "./../../../internal/tools.js";
import type { ApiResponse } from "./../../../components/ApiResponse.js";
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
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/json";
      body?: ApiResponse;
    }
  | { status: 415; contentType: "text/plain"; body: string };
