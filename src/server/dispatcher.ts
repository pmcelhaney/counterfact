import { mediaTypes } from "@hapi/accept";
import createDebugger from "debug";

import fetch, { Headers } from "node-fetch";

import type { ContextRegistry } from "./context-registry.js";
import type {
  HttpMethods,
  CounterfactResponseObject,
  Registry,
} from "./registry.js";
import { createResponseBuilder } from "./response-builder.js";
import { Tools } from "./tools.js";
import type { OpenApiOperation, OpenApiParameters } from "./types.ts";
import type { Config } from "./config.js";

const debug = createDebugger("counterfact:server:dispatcher");

interface ParameterTypes {
  body: {
    [key: string]: string;
  };
  cookie: {
    [key: string]: string;
  };
  formData: {
    [key: string]: string;
  };
  header: {
    [key: string]: string;
  };
  path: {
    [key: string]: string;
  };
  query: {
    [key: string]: string;
  };
}

export interface OpenApiDocument {
  basePath?: string;
  paths: {
    [key: string]: {
      [key in Lowercase<HttpMethods>]?: OpenApiOperation;
    };
  };
  produces?: string[];
}

export type DispatcherRequest = {
  auth?: {
    password?: string;
    username?: string;
  };
  body: unknown;
  headers: {
    [key: string]: string;
  };
  method: HttpMethods;
  path: string;
  query: {
    [key: string]: string;
  };
  req: {
    path?: string;
  };
};

export class Dispatcher {
  public registry: Registry;

  public contextRegistry: ContextRegistry;

  public openApiDocument: OpenApiDocument | undefined;

  public fetch: typeof fetch;

  public config?: Config; // Add config property

  public constructor(
    registry: Registry,
    contextRegistry: ContextRegistry,
    openApiDocument?: OpenApiDocument,
    config?: Config,
  ) {
    this.registry = registry;
    this.contextRegistry = contextRegistry;
    this.openApiDocument = openApiDocument;
    this.fetch = fetch;
    this.config = config;
  }

  private parameterTypes(
    parameters: OpenApiParameters[] | undefined,
  ): ParameterTypes {
    const types: ParameterTypes = {
      body: {},
      cookie: {},
      formData: {},
      header: {},
      path: {},
      query: {},
    };

    if (!parameters) {
      return types;
    }

    for (const parameter of parameters) {
      const type = parameter?.type;

      if (type !== undefined) {
        types[parameter.in][parameter.name] =
          type === "integer" ? "number" : type;
      }
    }

    return types;
  }

  private findOperation(
    path: string,
    method: HttpMethods,
  ): OpenApiOperation | undefined {
    if (this.openApiDocument) {
      for (const key in this.openApiDocument.paths) {
        if (key.toLowerCase() === path.toLowerCase()) {
          return this.openApiDocument.paths[key]?.[
            method.toLowerCase() as Lowercase<HttpMethods>
          ];
        }
      }
    }

    return undefined;
  }

  public operationForPathAndMethod(
    path: string,
    method: HttpMethods,
  ): OpenApiOperation | undefined {
    const operation = this.findOperation(path, method);

    if (operation === undefined) {
      return undefined;
    }

    if (this.openApiDocument?.produces) {
      return {
        produces: this.openApiDocument.produces,
        ...operation,
      };
    }

    return operation;
  }

  private normalizeResponse(
    response: CounterfactResponseObject,
    acceptHeader: string,
  ): CounterfactResponseObject {
    if (response.content !== undefined) {
      const content = this.selectContent(acceptHeader, response.content);

      if (content === undefined) {
        return {
          body: `Not Acceptable: could not produce a response matching any of the following content types: ${acceptHeader}`,
          contentType: "text/plain",
          status: 406,
        };
      }

      const normalizedResponse = {
        ...response,

        body: content.body as string | undefined,
        contentType: content.type,
      };

      delete normalizedResponse.content;

      return normalizedResponse;
    }

    return {
      ...response,

      contentType:
        response.headers?.["content-type"]?.toString() ??
        response.contentType ??
        "unknown/unknown",
    };
  }

  public selectContent(
    acceptHeader: string,
    content: { body: unknown; type: string }[],
  ) {
    const preferredMediaTypes = mediaTypes(acceptHeader);

    for (const mediaType of preferredMediaTypes) {
      const contentItem = content.find((item) =>
        this.isMediaType(item.type, mediaType),
      );

      if (contentItem) {
        return contentItem;
      }
    }

    return undefined;
  }

  private isMediaType(type: string, pattern: string) {
    if (pattern === "*/*") {
      return true;
    }

    const [baseType, subType] = type.split("/");

    const [patternType, patternSubType] = pattern.split("/");

    if (baseType === patternType) {
      return subType === patternSubType || patternSubType === "*";
    }

    if (subType === patternSubType) {
      return baseType === patternType || patternType === "*";
    }

    return false;
  }

  public async request({
    auth,
    body,
    headers = {},
    method,
    path,
    query,
    req,
  }: DispatcherRequest): Promise<CounterfactResponseObject> {
    debug(`request: ${method} ${path}`);

    // If the incoming path includes the base path, remove it
    if (
      this.openApiDocument?.basePath !== undefined &&
      path.toLowerCase().startsWith(this.openApiDocument.basePath.toLowerCase())
    ) {
      path = path.replace(new RegExp(this.openApiDocument.basePath, "iu"), "");
    }

    const { matchedPath } = this.registry.handler(path, method);
    const operation = this.operationForPathAndMethod(matchedPath, method);

    const response = await this.registry.endpoint(
      method,
      path,
      this.parameterTypes(operation?.parameters),
    )({
      auth,
      body,
      context: this.contextRegistry.find(matchedPath),

      headers,

      proxy: async (url: string) => {
        if (body !== undefined && headers.contentType !== "application/json") {
          throw new Error(
            `$.proxy() is currently limited to application/json requests. You tried to proxy to ${url} with a Content-Type of ${
              headers.contentType ?? "[unknown]"
            }. Please open an issue at https://github.com/pmcelhaney/counterfact/issues and prod me to fix this limitation.`,
          );
        }

        const fetchResponse = await this.fetch(`${url}${req.path ?? ""}`, {
          body: body === undefined ? undefined : JSON.stringify(body),
          headers: new Headers(headers),
          method,
        });

        const responseHeaders = Object.fromEntries(
          fetchResponse.headers.entries(),
        );

        return {
          body: await fetchResponse.text(),
          contentType: responseHeaders["content-type"] ?? "unknown/unknown",
          headers: responseHeaders,
          status: fetchResponse.status,
        };
      },

      query,

      // @ts-expect-error - Might be pushing the limits of what TypeScript can do here
      response: createResponseBuilder(
        operation ?? { responses: {} },
        this.config,
      ), // Pass config

      tools: new Tools({ headers }),
    });

    if (response === undefined) {
      return {
        body: `The ${method} function did not return anything. Did you forget a return statement?`,
        status: 500,
      };
    }

    const normalizedResponse = this.normalizeResponse(
      response,
      headers.accept ?? "*/*",
    );

    if (
      normalizedResponse.body !== undefined &&
      !mediaTypes(headers.accept ?? "*/*").some((type) =>
        this.isMediaType(normalizedResponse.contentType ?? "", type),
      )
    ) {
      return {
        body: JSON.stringify(mediaTypes(headers.accept ?? "*/*")),
        status: 406,
      };
    }

    return normalizedResponse;
  }
}
