import JSONSchemaFaker from "json-schema-faker";

JSONSchemaFaker.option("useExamplesValue", true);

function oneOf(items) {
  if (Array.isArray(items)) {
    return items[Math.floor(Math.random() * items.length)];
  }

  return oneOf(Object.values(items));
}

function unknownStatusCodeResponse(statusCode) {
  return {
    content: [
      {
        body: `The Open API document does not specify a response for status code ${statusCode}`,
        type: "text/plain",
      },
    ],

    status: 500,
  };
}

export function createResponseBuilder(operation) {
  return new Proxy(
    {},
    {
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get: (target, name) => ({
        header(name, value) {
          return {
            ...this,

            headers: {
              ...this.headers,
              [name]: value,
            },
          };
        },

        html(body) {
          return this.match("text/html", body);
        },

        json(body) {
          return this.match("application/json", body);
        },

        match(contentType, body) {
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

        random() {
          if (operation.produces) {
            return this.randomLegacy();
          }

          const response =
            operation.responses[this.status] ?? operation.responses.default;

          if (response === undefined) {
            return unknownStatusCodeResponse(this.status);
          }

          const { content } = response;

          return {
            ...this,

            content: Object.keys(content).map((type) => ({
              body: content[type].examples
                ? oneOf(content[type].examples)
                : JSONSchemaFaker.generate(content[type].schema),

              type,
            })),
          };
        },

        randomLegacy() {
          const response =
            operation.responses[this.status] ?? operation.responses.default;

          if (response === undefined) {
            return unknownStatusCodeResponse(this.status);
          }

          const body = response.examples
            ? oneOf(response.examples)
            : JSONSchemaFaker.generate(response.schema);

          return {
            ...this,

            content: operation.produces.map((type) => ({
              body,
              type,
            })),
          };
        },

        status: Number.parseInt(name, 10),

        text(body) {
          return this.match("text/plain", body);
        },
      }),
    },
  );
}
