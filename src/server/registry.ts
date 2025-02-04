import createDebugger from "debug";

import { ModuleTree } from "./module-tree.js";
import type { Tools } from "./tools.js";
import type { MediaType, ResponseBuilderFactory } from "./types.ts";

const debug = createDebugger("counterfact:server:registry");

type HttpMethods =
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT"
  | "TRACE";

interface RequestData {
  auth?: {
    password?: string;
    username?: string;
  };
  context: unknown;
  headers: { [key: string]: number | string | boolean };
  matchedPath?: string;
  path?: { [key: string]: number | string | boolean };
  proxy: (url: string) => Promise<{
    body: string;
    contentType: string;
    headers: { [key: string]: string };
    status: number;
  }>;
  query: { [key: string]: number | string | boolean };
  response: ResponseBuilderFactory;
  tools: Tools;
}

interface RequestDataWithBody extends RequestData {
  body?: unknown;
}

interface Module {
  DELETE?: (requestData: RequestData) => CounterfactResponse | undefined;
  GET?: (requestData: RequestData) => CounterfactResponse | undefined;
  HEAD?: (requestData: RequestData) => CounterfactResponse | undefined;
  OPTIONS?: (requestData: RequestData) => CounterfactResponse | undefined;
  PATCH?: (requestData: RequestData) => CounterfactResponse | undefined;
  POST?: (requestData: RequestDataWithBody) => CounterfactResponse | undefined;
  PUT?: (requestData: RequestDataWithBody) => CounterfactResponse | undefined;
  TRACE?: (requestData: RequestData) => CounterfactResponse | undefined;
}

type CounterfactResponseObject =
  | string
  | {
      body?: string;
      content?: {
        body: unknown;
        type: MediaType;
      }[];
      contentType?: string;
      headers?: { [key: string]: number | string };
      status?: number;
    };

type CounterfactResponse =
  | CounterfactResponseObject
  | Promise<CounterfactResponseObject>;

interface NormalizedCounterfactResponseObject {
  body?: string;
  content?: {
    body: unknown;
    type: MediaType;
  }[];
  contentType?: string;
  headers?: { [key: string]: number | string };
  status?: number;
}

function castParameter(value: string | number | boolean, type: string) {
  if (typeof value !== "string") {
    return value;
  }

  if (type === "integer") {
    return Number.parseInt(value);
  }

  if (type === "number") {
    return Number.parseFloat(value);
  }

  if (type === "boolean") {
    return value === "true";
  }

  return value;
}

function castParameters(
  parameters: { [key: string]: string | number | boolean } = {},
  parameterTypes: { [key: string]: string } = {},
) {
  const copy: { [key: string]: boolean | number | string } = {};

  Object.entries(parameters).forEach(([key, value]) => {
    copy[key] = castParameter(value, parameterTypes?.[key] ?? "string");
  });

  return copy;
}

export class Registry {
  private readonly moduleTree = new ModuleTree();

  public get routes() {
    return this.moduleTree.routes;
  }

  public add(url: string, module: Module) {
    this.moduleTree.add(url, module);
  }

  public remove(url: string) {
    this.moduleTree.remove(url);
  }

  public exists(method: HttpMethods, url: string) {
    return Boolean(this.handler(url, method).module?.[method]);
  }

  public handler(url: string, method: string) {
    const match = this.moduleTree.match(url, method);

    return {
      matchedPath: match?.matchedPath ?? "",
      module: match?.module,
      path: match?.pathVariables ?? {},
    };
  }

  public endpoint(
    httpRequestMethod: HttpMethods,
    url: string,
    parameterTypes: {
      header?: { [key: string]: string };
      path?: { [key: string]: string };
      query?: { [key: string]: string };
    } = {},
  ) {
    const handler = this.handler(url, httpRequestMethod);

    debug("handler for %s: %o", url, handler);

    const execute = handler.module?.[httpRequestMethod];

    if (!execute) {
      return () => ({
        body: `Could not find a ${httpRequestMethod} method matching ${url}\n`,
        contentType: "text/plain",
        headers: {},
        status: 404,
      });
    }

    return async ({ ...requestData }: RequestDataWithBody) => {
      const operationArgument: RequestDataWithBody & {
        x?: RequestDataWithBody;
      } = {
        ...requestData,
        headers: castParameters(requestData.headers, parameterTypes.header),
        matchedPath: handler.matchedPath,
        path: castParameters(handler.path, parameterTypes.path),
        query: castParameters(requestData.query, parameterTypes.query),
      };

      operationArgument.x = operationArgument;

      return await execute(operationArgument);
    };
  }
}

export type {
  CounterfactResponseObject,
  HttpMethods,
  Module,
  NormalizedCounterfactResponseObject,
  RequestDataWithBody,
};
