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
  query: { [key: string]: number | string };
  headers: { [key: string]: number | string };
  path: { [key: string]: number | string };
  matchedPath: string;
}

interface Module {
  GET: (requestData: RequestData) => unknown;
  PUT: (requestData: RequestData) => unknown;
  POST: (requestData: RequestData) => unknown;
  DELETE: (requestData: RequestData) => unknown;
  OPTIONS: (requestData: RequestData) => unknown;
  HEAD: (requestData: RequestData) => unknown;
  PATCH: (requestData: RequestData) => unknown;
  TRACE: (requestData: RequestData) => unknown;
}

interface Node {
  children?: { [key: string]: Node };
  module?: Module;
}

function castParameters(
  parameters: { [key: string]: number | string },
  parameterTypes?: { [key: string]: string }
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
      stripBrackets(segment1).localeCompare(stripBrackets(segment2))
    );
}

export class Registry {
  private readonly modules: { [key: string]: Module } = {};

  private readonly moduleTree: Node = { children: {} };

  private get routes() {
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

  private exists(method: HttpMethods, url: string) {
    return Boolean(this.handler(url).module?.[method]);
  }

  // eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
  private handler(url: string) {
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
      if (node.children[segment]) {
        node = node.children[segment];
        matchedParts.push(segment);
      } else {
        const dynamicSegment = Object.keys(node.children).find(
          (ds) => ds.startsWith("{") && ds.endsWith("}")
        );

        if (dynamicSegment !== undefined) {
          const variableName = dynamicSegment.slice(1, -1);

          path[variableName] = segment;

          node = node.children[dynamicSegment];

          matchedParts.push(dynamicSegment);
        }
      }
    }

    if (node === undefined) {
      throw new Error("node cannot be undefined");
    }

    return { module: node.module, path, matchedPath: matchedParts.join("/") };
  }

  public endpoint(
    httpRequestMethod: HttpMethods,
    url: string,
    parameterTypes: {
      header?: { [key: string]: string };
      query?: { [key: string]: string };
      path?: { [key: string]: string };
    } = {}
  ) {
    const handler = this.handler(url);
    const execute = handler.module?.[httpRequestMethod];

    if (!execute) {
      return () => ({
        status: 404,
        body: `Could not find a ${httpRequestMethod} method matching ${url}\n`,
        contentType: "text/plain",
      });
    }

    return ({ ...requestData }: RequestData) =>
      execute({
        ...requestData,

        headers: castParameters(requestData.headers, parameterTypes.header),

        query: castParameters(requestData.query, parameterTypes.query),

        path: castParameters(handler.path, parameterTypes.path),

        matchedPath: handler.matchedPath,
      });
  }
}

export type { Module };
