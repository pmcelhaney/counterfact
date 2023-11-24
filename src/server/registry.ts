import createDebugger from "debug";

import { ModuleTree } from "./module-tree.js";
import type { Tools } from "./tools.js";
import type { MediaType, ResponseBuilderFactory } from "./types.d.ts";

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
  context: unknown;
  headers: { [key: string]: number | string };
  matchedPath?: string;
  path?: { [key: string]: number | string };
  proxy: (url: string) => Promise<{
    body: string;
    contentType: string;
    headers: { [key: string]: string };
    status: number;
  }>;
  query: { [key: string]: number | string };
  response: ResponseBuilderFactory;
  tools: Tools;
}

interface RequestDataWithBody extends RequestData {
  body?: unknown;
}

interface Module {
  DELETE?: (requestData: RequestData) => CounterfactResponse;
  GET?: (requestData: RequestData) => CounterfactResponse;
  HEAD?: (requestData: RequestData) => CounterfactResponse;
  OPTIONS?: (requestData: RequestData) => CounterfactResponse;
  PATCH?: (requestData: RequestData) => CounterfactResponse;
  POST?: (requestData: RequestDataWithBody) => CounterfactResponse;
  PUT?: (requestData: RequestDataWithBody) => CounterfactResponse;
  TRACE?: (requestData: RequestData) => CounterfactResponse;
}

interface Node {
  children?: { [key: string]: Node };
  module?: Module;
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

function castParameters(
  parameters: { [key: string]: number | string },
  parameterTypes?: { [key: string]: string },
) {
  const copy: { [key: string]: number | string } = { ...parameters };

  Object.entries(copy).forEach(([key, value]) => {
    copy[key] =
      parameterTypes?.[key] === "number"
        ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          Number.parseInt(value as string, 10)
        : value;
  });

  return copy;
}

function maybe(flag: object | undefined, value: string): string[] {
  return flag ? [value] : [];
}

function stripBrackets(string: string) {
  return string.replaceAll(/\{|\}/gu, "");
}

function routesForNode(node: Node): string[] {
  if (!node.children) {
    return [];
  }

  return Object.entries(node.children)
    .flatMap(([segment, child]) => [
      ...maybe(child.module, `/${segment}`),
      ...routesForNode(child).map((route) => `/${segment}${route}`),
    ])
    .sort((segment1, segment2) =>
      stripBrackets(segment1).localeCompare(stripBrackets(segment2)),
    );
}

export class Registry {
  private readonly modules: { [key: string]: Module } = {};

  public readonly moduleTree: Node = { children: {} };

  private readonly moduleTree2 = new ModuleTree();

  public get routes() {
    return routesForNode(this.moduleTree);
  }

  public add(url: string, module: Module) {
    this.moduleTree2.add(url, module);
    let node: Node = this.moduleTree;

    for (const segment of url.split("/").slice(1)) {
      node.children ??= {};

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      node.children[segment] ??= {};
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      node = node.children[segment]!;
    }

    node.module = module;
  }

  public remove(url: string) {
    this.moduleTree2.remove(url);
  }

  public exists(method: HttpMethods, url: string) {
    return Boolean(this.handler(url).module?.[method]);
  }

  public handler(url: string) {
    const match = this.moduleTree2.match(url);

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
    const handler = this.handler(url);

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

    return async ({ ...requestData }: RequestDataWithBody) =>
      await execute({
        ...requestData,

        headers: castParameters(requestData.headers, parameterTypes.header),

        matchedPath: handler.matchedPath,

        path: castParameters(handler.path, parameterTypes.path),

        query: castParameters(requestData.query, parameterTypes.query),
      });
  }
}

export type {
  CounterfactResponseObject,
  HttpMethods,
  Module,
  NormalizedCounterfactResponseObject,
  RequestDataWithBody,
};
