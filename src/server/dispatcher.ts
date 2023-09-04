// eslint-disable-next-line import/newline-after-import
import { mediaTypes } from "@hapi/accept";
// eslint-disable-next-line @typescript-eslint/no-shadow
import fetch, { Headers } from "node-fetch";

import type { ContextRegistry } from "./context-registry.js";
import type {
  CounterfactResponseObject,
  HttpMethods,
  Registry,
} from "./registry.js";
import {
  createResponseBuilder,
  type OpenApiOperation,
} from "./response-builder.js";
import { Tools } from "./tools.js";

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

interface OpenApiParameters {
  in: "body" | "cookie" | "formData" | "header" | "path" | "query";
  name: string;
  schema?: {
    type: string;
  };
}

export interface OpenApiDocument {
  paths: {
    [key: string]: {
      [key in Lowercase<HttpMethods>]?: OpenApiOperation;
    };
  };
  produces?: string[];
}

export class Dispatcher {
  public registry: Registry;

  public contextRegistry: ContextRegistry;

  public openApiDocument: OpenApiDocument | undefined;

  public fetch: typeof fetch;

  public constructor(
    registry: Registry,
    contextRegistry: ContextRegistry,
    openApiDocument?: OpenApiDocument,
  ) {
    this.registry = registry;
    this.contextRegistry = contextRegistry;
    this.openApiDocument = openApiDocument;
    this.fetch = fetch;
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
      if (parameter.schema !== undefined) {
        types[parameter.in][parameter.name] =
          parameter.schema.type === "integer"
            ? "number"
            : parameter.schema.type;
      }
    }

    return types;
  }

  public operationForPathAndMethod(
    path: string,
    method: HttpMethods,
  ): OpenApiOperation | undefined {
    const operation: OpenApiOperation | undefined =
      this.openApiDocument?.paths[path]?.[
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        method.toLowerCase() as Lowercase<HttpMethods>
      ];

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
  ) {
    if (typeof response === "string") {
      return {
        body: response,
        contentType: "text/plain",
        headers: {},
        status: 200,
      };
    }

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
        body: content.body,
        contentType: content.type,
      };

      delete normalizedResponse.content;

      return normalizedResponse;
    }

    return {
      ...response,
      contentType: response.headers?.["content-type"] ?? "unknown/unknown",
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async request({
    body,
    headers = {},
    method,
    path,
    query,
    req,
  }: {
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
  }) {
    const { matchedPath } = this.registry.handler(path);
    const operation = this.operationForPathAndMethod(matchedPath, method);

    const response = await this.registry.endpoint(
      method,
      path,
      this.parameterTypes(operation?.parameters),
    )({
      body,
      context: this.contextRegistry.find(path),
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
      response: createResponseBuilder(operation ?? { responses: {} }),

      tools: new Tools({ headers }),
    });

    const normalizedResponse = this.normalizeResponse(
      response,
      headers.accept ?? "*/*",
    );

    if (
      !mediaTypes(headers.accept ?? "*/*").some((type) =>
        this.isMediaType(normalizedResponse.contentType, type),
      )
    ) {
      return { body: mediaTypes(headers.accept ?? "*/*"), status: 406 };
    }

    return normalizedResponse;
  }
}

export type { OpenApiParameters };
