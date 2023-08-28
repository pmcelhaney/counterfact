// eslint-disable-next-line import/newline-after-import
import Accept from "@hapi/accept";
// eslint-disable-next-line no-shadow
import fetch, { Headers } from "node-fetch";

import { createResponseBuilder } from "./response-builder.js";
import { Tools } from "./tools.js";

function parameterTypes(parameters) {
  if (!parameters) {
    return {};
  }

  const types = {
    body: {},
    cookie: {},
    formData: {},
    header: {},
    path: {},
    query: {},
  };

  for (const parameter of parameters) {
    if (parameter.schema) {
      types[parameter.in][parameter.name] =
        parameter.schema.type === "integer" ? "number" : parameter.schema.type;
    }
  }

  return types;
}

export class Dispatcher {
  registry;

  // alias the fetch function so we can mock it in tests
  fetch = fetch;

  constructor(registry, contextRegistry, openApiDocument) {
    this.registry = registry;
    this.contextRegistry = contextRegistry;
    this.openApiDocument = openApiDocument;
  }

  operationForPathAndMethod(path, method) {
    const operation =
      this.openApiDocument?.paths?.[path]?.[method.toLowerCase()];

    if (this.openApiDocument?.produces) {
      return {
        produces: this.openApiDocument.produces,
        ...operation,
      };
    }

    return operation;
  }

  async request({ body, headers, method, path, query, req }) {
    const { matchedPath } = this.registry.handler(path);
    const operation = this.operationForPathAndMethod(matchedPath, method);

    const response = await this.registry.endpoint(
      method,
      path,
      parameterTypes(operation?.parameters),
    )({
      body,
      context: this.contextRegistry.find(path),
      headers,

      proxy: async (url) => {
        if (
          body &&
          headers.contentType &&
          headers.contentType !== "application/json"
        ) {
          throw new Error(
            `$.proxy() is currently limited to application/json requests. You tried to proxy to ${url} with a Content-Type of ${headers.contentType}. Please open an issue at https://github.com/pmcelhaney/counterfact/issues and prod me to fix this limitation.`,
          );
        }

        const fetchResponse = await this.fetch(url + req.path, {
          body: body ? JSON.stringify(body) : undefined,
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

      response: createResponseBuilder(
        this.operationForPathAndMethod(
          this.registry.handler(path).matchedPath,
          method,
        ),
      ),

      tools: new Tools({ headers }),
    });

    const normalizedResponse = this.normalizeResponse(
      response,
      headers?.accept ?? "*/*",
    );

    if (
      !Accept.mediaTypes(headers?.accept ?? "*/*").some((type) =>
        this.isMediaType(normalizedResponse.contentType, type),
      )
    ) {
      return { body: Accept.mediaTypes(headers?.accept ?? "*/*"), status: 406 };
    }

    return normalizedResponse;
  }

  normalizeResponse(response, acceptHeader) {
    if (typeof response === "string") {
      return {
        body: response,
        contentType: "text/plain",
        headers: {},
        status: 200,
      };
    }

    if (response.content) {
      const content = this.selectContent(acceptHeader, response.content);

      if (!content) {
        return {
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

    return response;
  }

  selectContent(acceptHeader, content) {
    const preferredMediaTypes = Accept.mediaTypes(acceptHeader);

    for (const mediaType of preferredMediaTypes) {
      const contentItem = content.find((item) =>
        this.isMediaType(item.type, mediaType),
      );

      if (contentItem) {
        return contentItem;
      }
    }

    return {
      body: "no match",
      type: preferredMediaTypes,
    };
  }

  isMediaType(type, pattern) {
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
}
