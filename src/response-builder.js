export function createResponseBuilder() {
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
      }),
    }
  );
}
