import JSONSchemaFaker, { type Schema } from "json-schema-faker";

interface ResponseBuilder {
  status?: number;
  [status: number | `${number} ${string}`]: ResponseBuilder;
  headers: { [name: string]: string };
  match: (contentType: string, body: unknown) => ResponseBuilder;
  content?: { type: string; body: unknown }[];
  html: (body: unknown) => ResponseBuilder;
  json: (body: unknown) => ResponseBuilder;
  text: (body: unknown) => ResponseBuilder;
  random: () => ResponseBuilder;
  randomLegacy: () => ResponseBuilder;
  header: (name: string, value: string) => ResponseBuilder;
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
    status: 500,

    content: [
      {
        type: "text/plain",

        body: `The Open API document does not specify a response for status code ${
          statusCode ?? '""'
        }`,
      },
    ],
  };
}

export type MediaType = `${string}/${string}`;

export interface OpenApiResponse {
  headers: { [key: string]: OpenApiHeader };
  content: { [key: MediaType]: OpenApiContent };
}

export interface OpenApiOperation {
  produces?: string[];
  responses: {
    [status: string]: {
      content?: {
        [type: number | string]: {
          examples?: unknown[];
          schema: unknown;
        };
      };
      examples?: { [key: string]: unknown };
      schema?: Schema;
    };
  };
}

export function createResponseBuilder(
  operation: OpenApiOperation
): ResponseBuilder {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return new Proxy({} as ResponseBuilder, {
    // eslint-disable-next-line sonarjs/cognitive-complexity
    get: (target, statusCode: string) => ({
      status: Number.parseInt(statusCode, 10),

      header(
        this: ResponseBuilder,
        name: string,
        value: string
      ): ResponseBuilder {
        return {
          ...this,

          headers: {
            ...this.headers,
            [name]: value,
          },
        };
      },

      match(
        this: ResponseBuilder,
        contentType: string,
        body: unknown
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

      text(this: ResponseBuilder, body: unknown) {
        return this.match("text/plain", body);
      },

      html(this: ResponseBuilder, body: unknown) {
        return this.match("text/html", body);
      },

      json(this: ResponseBuilder, body: unknown) {
        return this.match("application/json", body);
      },

      random(this: ResponseBuilder) {
        if (operation.produces) {
          return this.randomLegacy();
        }

        const response =
          operation.responses[this.status ?? "default"] ??
          operation.responses.default;

        if (response === undefined || response.content === undefined) {
          return unknownStatusCodeResponse(this.status);
        }

        const { content } = response;

        return {
          ...this,

          content: Object.keys(content).map((type) => ({
            type,

            body: content[type]?.examples
              ? oneOf(content[type]?.examples ?? [])
              : JSONSchemaFaker.generate(
                  // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
                  content[type]?.schema ?? { type: "object" }
                ),
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
            type,
            body,
          })),
        };
      },
    }),
  });
}
