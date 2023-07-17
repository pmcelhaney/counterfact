// eslint-disable-next-line @typescript-eslint/no-shadow
import fetch, { Headers } from "node-fetch";
import Accept from "@hapi/accept";

import {
  type OpenApiOperation,
  createResponseBuilder,
} from "./response-builder.js";
import { Tools } from "./tools.js";
import type {
  CounterfactResponseObject,
  HttpMethods,
  Registry,
} from "./registry.js";
import type { ContextRegistry } from "./context-registry.js";

interface ParameterTypes {
  path: {
    [key: string]: string;
  };
  query: {
    [key: string]: string;
  };
  header: {
    [key: string]: string;
  };
  cookie: {
    [key: string]: string;
  };
  formData: {
    [key: string]: string;
  };
  body: {
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

interface OpenApiDocument {
  paths: {
    [key: string]: {
      [key in HttpMethods]?: {
        parameters?: OpenApiParameters[];
        responses: {
          [key: string]: CounterfactResponseObject;
        };
      };
    };
  };
}

export class Dispatcher {
  public registry: Registry;

  public contextRegistry: ContextRegistry;

  public openApiDocument: unknown;

  public fetch: typeof fetch;

  public constructor(
    registry: Registry,
    contextRegistry: ContextRegistry,
    openApiDocument: OpenApiDocument
  ) {
    this.registry = registry;
    this.contextRegistry = contextRegistry;
    this.openApiDocument = openApiDocument;
    this.fetch = fetch;
  }

  private parameterTypes(
    parameters: OpenApiParameters[] | undefined
  ): ParameterTypes {
    const types: ParameterTypes = {
      path: {},
      query: {},
      header: {},
      cookie: {},
      formData: {},
      body: {},
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

  private operationForPathAndMethod(
    path: string,
    method: string
  ): OpenApiOperation | undefined {
    return this.openApiDocument?.paths?.[path]?.[method.toLowerCase()];
  }

  private normalizeResponse(
    response: CounterfactResponseObject,
    acceptHeader: string
  ) {
    if (typeof response === "string") {
      return {
        status: 200,
        headers: {},
        contentType: "text/plain",
        body: response,
      };
    }

    if (response.content !== undefined) {
      const content = this.selectContent(acceptHeader, response.content);

      if (content === undefined) {
        return {
          status: 406,
          body: `Not Acceptable: could not produce a response matching any of the following content types: ${acceptHeader}`,
        };
      }

      const normalizedResponse = {
        ...response,
        contentType: content.type,
        body: content.body,
      };

      delete normalizedResponse.content;

      return normalizedResponse;
    }

    return response;
  }

  private selectContent(
    acceptHeader: string,
    content: { type: string; body: unknown }[]
  ) {
    const preferredMediaTypes = Accept.mediaTypes(acceptHeader);

    for (const mediaType of preferredMediaTypes) {
      const contentItem = content.find((item) =>
        this.isMediaType(item.type, mediaType)
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
    method,
    path,
    headers = {},
    body,
    query,
    req,
  }: {
    method: HttpMethods;
    path: string;
    headers: {
      [key: string]: string;
    };
    body: unknown;
    query: {
      [key: string]: string;
    };
    req: {
      path: string;
    };
  }) {
    const { matchedPath } = this.registry.handler(path);
    const operation = this.operationForPathAndMethod(matchedPath, method);

    const response = await this.registry.endpoint(
      method,
      path,
      this.parameterTypes(operation?.parameters)
    )({
      tools: new Tools({ headers }),
      body,
      query,
      headers,
      context: this.contextRegistry.find(path),

      response: createResponseBuilder(operation ?? { responses: {} }),

      proxy: async (url: string) => {
        if (body !== undefined && headers.contentType !== "application/json") {
          throw new Error(
            `$.proxy() is currently limited to application/json requests. You tried to proxy to ${url} with a Content-Type of ${
              headers.contentType ?? "[unknown]"
            }. Please open an issue at https://github.com/pmcelhaney/counterfact/issues and prod me to fix this limitation.`
          );
        }

        const fetchResponse = await this.fetch(url + req.path, {
          method,
          headers: new Headers(headers),
          body: body === undefined ? undefined : JSON.stringify(body),
        });

        const responseHeaders = Object.fromEntries(
          fetchResponse.headers.entries()
        );

        return {
          status: fetchResponse.status,
          contentType: responseHeaders["content-type"] ?? "unknown/unknown",
          headers: responseHeaders,
          body: await fetchResponse.text(),
        };
      },
    });

    const normalizedResponse = this.normalizeResponse(
      response,
      headers.accept ?? "*/*"
    );

    if (
      !Accept.mediaTypes(headers.accept ?? "*/*").some((type) =>
        this.isMediaType(normalizedResponse.contentType, type)
      )
    ) {
      return { status: 406, body: Accept.mediaTypes(headers.accept ?? "*/*") };
    }

    return normalizedResponse;
  }
}

export type { OpenApiParameters };
