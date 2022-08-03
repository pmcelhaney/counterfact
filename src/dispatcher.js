import Accept from "@hapi/accept";

import { Tools } from "./tools.js";

export class Dispatcher {
  registry;

  constructor(registry) {
    this.registry = registry;
  }

  request({ method, path, headers, body, query }) {
    const normalizedResponse = this.normalizeResponse(
      this.registry.endpoint(
        method,
        path
      )({
        tools: new Tools({ headers }),

        context: this.registry.context,
        body,
        query,
        headers,
      }),
      headers?.accept ?? "*/*"
    );

    if (
      !Accept.mediaTypes(headers?.accept ?? "*/*").some((type) =>
        this.isMediaType(normalizedResponse.contentType, type)
      )
    ) {
      return { status: 406, body: Accept.mediaTypes(headers?.accept ?? "*/*") };
    }

    return normalizedResponse;
  }

  normalizeResponse(response, acceptHeader) {
    if (typeof response === "string") {
      return {
        status: 200,
        headers: {},
        contentType: "text/plain",
        body: response,
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
        contentType: content.type,
        body: content.body,
        content: undefined,
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
        this.isMediaType(item.type, mediaType)
      );

      if (contentItem) {
        return contentItem;
      }
    }

    return {
      type: preferredMediaTypes,
      body: "no match",
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
