import { JSONSchemaFaker, type Schema } from "json-schema-faker";

import type { OpenApiParameters } from "./dispatcher.js";

interface ResponseBuilder {
  [status: number | `${number} ${string}`]: ResponseBuilder;
  content?: { body: unknown; type: string }[];
  header: (name: string, value: string) => ResponseBuilder;
  headers: { [name: string]: string };
  html: (body: unknown) => ResponseBuilder;
  json: (body: unknown) => ResponseBuilder;
  match: (contentType: string, body: unknown) => ResponseBuilder;
  random: () => ResponseBuilder;
  randomLegacy: () => ResponseBuilder;
  status?: number;
  text: (body: unknown) => ResponseBuilder;
}

interface OpenApiHeader {
  schema: unknown;
}

interface OpenApiContent {
  schema: unknown;
}

JSONSchemaFaker.option("useExamplesValue", true);

function oneOf(items: unknown[] | { [key: string]: unknown }): unknown {
  if (Array.isArray(items)) {
    return items[Math.floor(Math.random() * items.length)];
  }

  return oneOf(Object.values(items));
}

function unknownStatusCodeResponse(statusCode: number | undefined) {
  return {
    content: [
      {
        body: `The Open API document does not specify a response for status code ${
          statusCode ?? '""'
        }`,

        type: "text/plain",
      },
    ],

    status: 500,
  };
}

interface Example {
  description: string;
  summary: string;
  value: unknown;
}

export type MediaType = `${string}/${string}`;

export interface OpenApiResponse {
  content: { [key: MediaType]: OpenApiContent };
  headers: { [key: string]: OpenApiHeader };
}

export interface OpenApiOperation {
  parameters?: OpenApiParameters[];
  produces?: string[];
  responses: {
    [status: string]: {
      content?: {
        [type: number | string]: {
          examples?: { [key: string]: Example };
          schema: unknown;
        };
      };
      examples?: { [key: string]: unknown };
      schema?: Schema;
    };
  };
}

export function createResponseBuilder(
  operation: OpenApiOperation,
): ResponseBuilder {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return new Proxy({} as ResponseBuilder, {
    // eslint-disable-next-line sonarjs/cognitive-complexity
    get: (target, statusCode: string) => ({
      header(
        this: ResponseBuilder,
        name: string,
        value: string,
      ): ResponseBuilder {
        return {
          ...this,

          headers: {
            ...this.headers,
            [name]: value,
          },
        };
      },

      html(this: ResponseBuilder, body: unknown) {
        return this.match("text/html", body);
      },

      json(this: ResponseBuilder, body: unknown) {
        return this.match("application/json", body);
      },

      match(
        this: ResponseBuilder,
        contentType: string,
        body: unknown,
      ): ResponseBuilder {
        return {
          ...this,

          content: [
            ...(this.content ?? []),
            {
              body,
              type: contentType,
            },
          ],
        };
      },

      random(this: ResponseBuilder) {
        if (operation.produces) {
          return this.randomLegacy();
        }

        const response =
          operation.responses[this.status ?? "default"] ??
          operation.responses.default;

        if (response?.content === undefined) {
          return unknownStatusCodeResponse(this.status);
        }

        const { content } = response;

        return {
          ...this,

          content: Object.keys(content).map((type) => ({
            body: content[type]?.examples
              ? oneOf(
                  Object.values(content[type]?.examples ?? []).map(
                    (example) => example.value,
                  ),
                )
              : JSONSchemaFaker.generate(
                  // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
                  content[type]?.schema ?? { type: "object" },
                ),

            type,
          })),
        };
      },

      randomLegacy(this: ResponseBuilder) {
        const response =
          operation.responses[this.status ?? "default"] ??
          operation.responses.default;

        if (response === undefined) {
          return unknownStatusCodeResponse(this.status);
        }

        const body = response.examples
          ? oneOf(response.examples)
          : JSONSchemaFaker.generate(response.schema ?? { type: "object" });

        return {
          ...this,

          content: operation.produces?.map((type) => ({
            body,
            type,
          })),
        };
      },

      status: Number.parseInt(statusCode, 10),

      text(this: ResponseBuilder, body: unknown) {
        return this.match("text/plain", body);
      },
    }),
  });
}
