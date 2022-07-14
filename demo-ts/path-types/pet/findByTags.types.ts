import type { Context } from "../../context/context.js";
import type { Tools } from "./../../internal/tools.js";
import type { Pet } from "./../../components/Pet.js";
export type HTTP_GET = ({
  query,
  path,
  header,
  body,
  context,
  tools,
}: {
  query: { tags?: Array<string> };
  path: never;
  header: never;
  body: undefined;
  context: Context;
  tools: Tools;
}) =>
  | {
      status: 200;
      contentType?: "application/xml";
      body?: Array<Pet>;
    }
  | {
      status: 200;
      contentType?: "application/json";
      body?: Array<Pet>;
    }
  | {
      status: 400;
    }
  | { status: 415; contentType: "text/plain"; body: string };
