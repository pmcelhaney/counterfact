import type { ResponseBuilder } from "../../templates/response-builder-factory.js";
import type { MediaType } from "./response-builder.js";
import type { Tools } from "./tools.js";

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
  headers: { [key: string]: string };
  matchedPath?: string;
  path?: { [key: string]: number | string };
  proxy: unknown;
  query: { [key: string]: number | string };
  response: ResponseBuilder;
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
      headers?: { [key: string]: string };
      status?: number;
    };

type CounterfactResponse =
  | CounterfactResponseObject
  | Promise<CounterfactResponseObject>;

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

  public get routes() {
    return routesForNode(this.moduleTree);
  }

  public add(url: string, module: Module) {
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
    let node: Node | undefined = this.moduleTree;

    for (const segment of url.split("/").slice(1)) {
      node = node.children?.[segment];

      if (!node) {
        return false;
      }
    }

    delete node.module;

    return true;
  }

  public exists(method: HttpMethods, url: string) {
    return Boolean(this.handler(url).module?.[method]);
  }

  // eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
  public handler(url: string) {
    let node: Node | undefined = this.moduleTree;

    const path: { [key: string]: string } = {};

    const matchedParts = [""];

    for (const segment of url.split("/").slice(1)) {
      if (node === undefined) {
        throw new Error("node or node node.children cannot be undefined");
      }

      if (node.children === undefined) {
        throw new Error("node or node node.children cannot be undefined");
      }

      const matchingChild = Object.keys(node.children).find(
        (candidate) => candidate.toLowerCase() === segment.toLowerCase(),
      );

      if (matchingChild === undefined) {
        const dynamicSegment: string | undefined = Object.keys(
          node.children,
        ).find((ds) => ds.startsWith("{") && ds.endsWith("}"));

        if (dynamicSegment !== undefined) {
          const variableName: string = dynamicSegment.slice(1, -1);

          path[variableName] = segment;

          node = node.children[dynamicSegment];

          matchedParts.push(dynamicSegment);
        }
      } else {
        node = node.children[matchingChild];
        matchedParts.push(matchingChild);
      }
    }

    if (node === undefined) {
      throw new Error("node cannot be undefined");
    }

    return { matchedPath: matchedParts.join("/"), module: node.module, path };
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

export type { CounterfactResponseObject, HttpMethods, Module };
