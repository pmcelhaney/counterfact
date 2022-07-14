import type { Context } from "../context/context.js";
import type { User } from "./../components/User.js";
import type { Tools } from "./../internal/tools.js";
export type HTTP_POST = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: undefined;
  path: undefined;
  header: undefined;
  body: User;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: number | undefined;
      contentType?: "application/json";
      body?: User;
    }
  | {
      status: number | undefined;
      contentType?: "application/xml";
      body?: User;
    }
  | { status: 415; contentType: "text/plain"; body: string };
