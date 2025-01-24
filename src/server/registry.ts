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

type UserDefinedResponse =
  | Promise<CounterfactResponseObject | undefined | string>
  | CounterfactResponseObject
  | undefined
  | string;

interface Module {
  DELETE?: (requestData: RequestData) => UserDefinedResponse;
  GET?: (requestData: RequestData) => UserDefinedResponse;
  HEAD?: (requestData: RequestData) => UserDefinedResponse;
  OPTIONS?: (requestData: RequestData) => UserDefinedResponse;
  PATCH?: (requestData: RequestData) => UserDefinedResponse;
  POST?: (requestData: RequestDataWithBody) => UserDefinedResponse;
  PUT?: (requestData: RequestDataWithBody) => UserDefinedResponse;
  TRACE?: (requestData: RequestData) => UserDefinedResponse;
}

type CounterfactResponseObject = {
  body?: string;
  content?: {
    body: unknown;
    type: MediaType;
  }[];
  contentType?: string;
  headers?: { [key: string]: number | string };
  status?: number;
};

type RespondTo = ($: RequestData) => Promise<CounterfactResponseObject>;

type InterceptorCallback = ($: RequestData, respondTo: RespondTo) => void;

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

  private interceptor: InterceptorCallback = ($, respondTo) => respondTo($);

  public get routes() {
    return this.moduleTree.routes;
  }

  public add(url: string, module: Module) {
    this.moduleTree.add(url, module);
  }

  public addInterceptor(url: string, callback: InterceptorCallback): void {
    this.interceptor = callback;
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

      const executeAndNormalizeResponse = async (
        requestData: RequestDataWithBody,
      ) => {
        const result = await execute(requestData);
        if (typeof result === "string") {
          return {
            headers: {},
            status: 200,
            body: result,
            contentType: "text/plain",
          };
        }

        if (typeof result === "undefined") {
          return {
            headers: {},
            body: `The ${httpRequestMethod} function did not return anything. Did you forget a return statement?`,
            status: 500,
          };
        }
        return result;
      };

      return this.interceptor(operationArgument, executeAndNormalizeResponse);
    };
  }
}

export type {
  CounterfactResponseObject,
  HttpMethods,
  Module,
  RequestDataWithBody,
};
