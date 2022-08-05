import jsf from "json-schema-faker";

jsf.option("useExamplesValue", true);

export function createResponseBuilder(operation) {
  return new Proxy(
    {},
    {
      get: (target, name) => ({
        status: Number.parseInt(name, 10),

        header(name, value) {
          return {
            ...this,

            headers: {
              ...this.headers,
              [name]: value,
            },
          };
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

        text(body) {
          return this.match("text/plain", body);
        },

        html(body) {
          return this.match("text/html", body);
        },

        json(body) {
          return this.match("application/json", body);
        },

        random() {
          const response =
            operation.responses[this.status] ?? operation.responses.default;

          if (response === undefined) {
            return {
              status: 500,

              content: [
                {
                  type: "text/plain",
                  body: `The Open API document does not specify a response for status code ${this.status}`,
                },
              ],
            };
          }

          const { content } = response;

          return {
            ...this,

            content: Object.keys(content).map((type) => ({
              type,

              body: jsf.generate(content[type].schema),
            })),
          };
        },
      }),
    }
  );
}
