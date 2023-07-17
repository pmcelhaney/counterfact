/* eslint-disable max-lines */

// Note: I cut a few corners here on type checking. Since these are tests, I'm more
// concerned about the tests passing at runtime than lining up the types perfectly.

import {
  Dispatcher,
  type OpenApiDocument,
} from "../../src/server/dispatcher.js";
import { ContextRegistry } from "../../src/server/context-registry.js";
import { Registry } from "../../src/server/registry.js";

// eslint-disable-next-line max-statements
describe("a dispatcher", () => {
  it("dispatches a get request to a server and returns the response", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      GET() {
        return {
          body: "hello",
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const response = await dispatcher.request({
      method: "GET",
      path: "/hello",
      headers: {},
      body: "",
      req: { path: "/hello" },
      query: {},
    });

    expect(response.body).toBe("hello");
  });

  it("converts a string return value to a full response object with content-type text/plain", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      GET() {
        return "hello";
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const response = await dispatcher.request({
      method: "GET",
      path: "/hello",
      headers: {},
      body: "",
      req: { path: "/hello" },
      query: {},
    });

    expect(response).toStrictEqual({
      status: 200,
      headers: {},
      contentType: "text/plain",
      body: "hello",
    });
  });

  it("finds the best content item for an accept header", () => {
    const dispatcher = new Dispatcher(new Registry(), new ContextRegistry());

    const html = dispatcher.selectContent("text/html", [
      {
        type: "text/plain",
        body: "hello",
      },
      {
        type: "text/html",
        body: "<h1>hello</h1>",
      },
    ]);

    expect(html?.type).toBe("text/html");
  });

  it("returns HTTP 406 if it can't return content matching the accept header", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      GET() {
        return {
          status: 200,
          contentType: "text/plain",
          body: "I am not JSON",
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const response = await dispatcher.request({
      method: "GET",
      path: "/hello",

      headers: {
        accept: "application/json",
      },

      body: "",
      req: { path: "/hello" },
      query: {},
    });

    expect(response.status).toBe(406);
  });

  it.each([
    ["text/html", ["text/html"], "text/html"],
    ["text/plain", ["text/html", "text/plain"], "text/plain"],
    ["text/*", ["text/html", "text/plain"], "text/html"],
    ["*/json", ["text/html", "application/json"], "application/json"],
    [
      "*/html;q=0.1,*/json;q=0.2",
      ["text/html", "application/json"],
      "application/json",
    ],
  ])(
    'given accept header "%s" and content types: %s, select %s',
    (acceptHeader, types, expected) => {
      const dispatcher = new Dispatcher(new Registry(), new ContextRegistry());

      const content = types.map((type) => ({ type, body: "" }));

      expect(dispatcher.selectContent(acceptHeader, content)?.type).toBe(
        expected
      );
    }
  );

  it("selects the best content item matching the Accepts header", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      GET() {
        return {
          status: 200,

          headers: {},

          content: [
            {
              type: "text/plain",
              body: "Hello, world!",
            },
            {
              type: "text/html",
              body: "<h1>Hello, world!</h1>",
            },
          ],
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const html = await dispatcher.request({
      method: "GET",
      path: "/hello",

      headers: {
        accept: "text/html",
      },

      body: "",
      req: { path: "/hello" },
      query: {},
    });

    expect(html).toStrictEqual({
      status: 200,
      headers: {},
      contentType: "text/html",
      body: "<h1>Hello, world!</h1>",
    });
  });

  it("passes the request body", async () => {
    const registry = new Registry();

    registry.add("/a", {
      POST({ body }) {
        return {
          body: `Hello ${body.name} of ${body.place}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const response = await dispatcher.request({
      method: "POST",
      path: "/a",

      body: {
        name: "Catherine",
        place: "Aragon",
      },

      req: { path: "/a" },
      query: {},
      headers: {},
    });

    expect(response.body).toBe("Hello Catherine of Aragon!");
  });

  it("passes the request headers", async () => {
    const registry = new Registry();
    const mockedJWT = "test token";

    registry.add("/a", {
      GET({ headers }) {
        return {
          headers,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());

    const authHeader = {
      Authorization: `Bearer: ${mockedJWT}`,
      "Cache-Control": "max-age=0",
    };

    const response = await dispatcher.request({
      method: "GET",
      path: "/a",

      headers: authHeader,
      body: "",
      req: { path: "/a" },
      query: {},
    });

    if (!("headers" in response)) {
      // TypeScript thinks the response object might not have a headers property. Can't figure out why.
      throw new Error("response.headers not defined");
    }

    expect(response.headers).toStrictEqual(authHeader);
  });

  it("passes the query params", async () => {
    const registry = new Registry();

    registry.add("/a", {
      GET({ query }) {
        return {
          body: `Searching for stores near ${String(query.zip)}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const response = await dispatcher.request({
      method: "GET",
      path: "/a",

      query: {
        zip: "90210",
      },

      body: "",
      req: { path: "/a" },
      headers: {},
    });

    expect(response.body).toBe("Searching for stores near 90210!");
  });

  it("passes a tools object", async () => {
    const registry = new Registry();

    registry.add("/a", {
      GET({ tools }) {
        return { body: tools.accepts("text/html") };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const htmlResponse = await dispatcher.request({
      method: "GET",
      path: "/a",

      headers: {
        Accept: "text/html",
      },

      body: "",
      req: { path: "/a" },
      query: {},
    });

    expect(htmlResponse.body).toBe(true);

    const textResponse = await dispatcher.request({
      method: "GET",
      path: "/a",

      headers: {
        Accept: "text/plain",
      },

      body: "",
      req: { path: "/a" },
      query: {},
    });

    expect(textResponse.body).toBe(false);
  });

  it("passes a response builder", async () => {
    const registry = new Registry();

    registry.add("/a", {
      GET({ response }) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return response[200].text("hello").html("<h1>hello</h1>");
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const htmlResponse = await dispatcher.request({
      method: "GET",
      path: "/a",

      headers: {
        accept: "text/html",
      },

      body: "",
      req: { path: "/a" },
      query: {},
    });

    expect(htmlResponse.body).toBe("<h1>hello</h1>");
  });

  it("gives the response builder the OpenAPI object it needs to generate a random response", async () => {
    const registry = new Registry();

    registry.add("/a", {
      GET({ response }) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return response[200]?.random();
      },
    });

    const openApiDocument = {
      paths: {
        "/a": {
          get: {
            responses: {
              200: {
                content: {
                  "text/plain": {
                    schema: {
                      type: "string",
                      examples: ["hello"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const dispatcher = new Dispatcher(
      registry,
      new ContextRegistry(),
      openApiDocument
    );
    const htmlResponse = await dispatcher.request({
      method: "GET",
      path: "/a",

      headers: {
        accept: "text/plain",
      },

      body: "",
      req: { path: "/a" },
      query: {},
    });

    expect(htmlResponse.body).toBe("hello");
  });

  it("passes status code in the response", async () => {
    const registry = new Registry();

    registry.add("/stuff", {
      PUT() {
        return {
          status: 201,
          body: "ok",
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const response = await dispatcher.request({
      method: "PUT",
      path: "/stuff",
      body: "",
      req: { path: "/stuff" },
      query: {},
      headers: {},
    });

    expect(response.status).toBe(201);
  });

  it("allows the context object to be mutated directly", async () => {
    const registry = new Registry();
    const contextRegistry = new ContextRegistry();
    const rootContext = { value: 0 };

    contextRegistry.add("/", rootContext);

    registry.add("/increment/{value}", {
      GET({
        context,
        path,
      }: {
        context: { value: number };
        path: { value: string };
      }) {
        const amountToIncrement = Number.parseInt(path.value, 10);

        context.value += amountToIncrement;

        return { body: "incremented" };
      },
    });

    const dispatcher = new Dispatcher(registry, contextRegistry);

    const result = await dispatcher.request({
      method: "GET",
      path: "/increment/1",
      body: "",
      req: { path: "/increment/1" },
      query: {},
      headers: {},
    });

    expect(result.body).toBe("incremented");

    expect(rootContext.value).toBe(1);

    await dispatcher.request({
      method: "GET",
      path: "/increment/2",
      body: "",
      req: { path: "/increment/2" },
      query: {},
      headers: {},
    });

    expect(rootContext.value).toBe(3);
  });

  it("passes a context object", async () => {
    const registry = new Registry();
    const contextRegistry = new ContextRegistry();

    contextRegistry.add("/", { id: "test context" });
    registry.add("/echo", {
      GET({ context }) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return { body: context.id };
      },
    });

    const dispatcher = new Dispatcher(registry, contextRegistry);

    const result = await dispatcher.request({
      method: "GET",
      path: "/echo",
      body: "",
      req: { path: "/echo" },
      query: {},
      headers: {},
    });

    expect(result.body).toBe("test context");
  });

  it("converts query, path, and header parameters to numbers if necessary", async () => {
    const registry = new Registry();

    registry.add("/a/{integerInPath}/{stringInPath}", {
      GET({ response, path, query, headers }) {
        if (path === undefined) {
          throw new Error("path is undefined");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return response[200].text({
          integerInPath: path.integerInPath,
          stringInPath: path.stringInPath,
          numberInQuery: query.numberInQuery,
          stringInQuery: query.stringInQuery,
          numberInHeader: headers.numberInHeader,
          stringInHeader: headers.stringInHeader,
        });
      },
    });

    const openApiDocument: OpenApiDocument = {
      paths: {
        "/a/{integerInPath}/{stringInPath}": {
          get: {
            parameters: [
              {
                name: "integerInPath",
                in: "path",
                schema: { type: "integer" },
              },
              { name: "stringInPath", in: "path", schema: { type: "string" } },
              {
                name: "numberInQuery",
                in: "query",
                schema: { type: "number" },
              },
              {
                name: "stringInQuery",
                in: "query",
                schema: { type: "string" },
              },
              {
                name: "numberInHeader",
                in: "header",
                schema: { type: "number" },
              },
              {
                name: "stringInHeader",
                in: "header",
                schema: { type: "string" },
              },
            ],

            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      integerInPath: "number",
                      stringInPath: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const dispatcher = new Dispatcher(
      registry,
      new ContextRegistry(),
      openApiDocument
    );
    const htmlResponse = await dispatcher.request({
      method: "GET",
      path: "/a/1/2",

      query: {
        numberInQuery: "3",
        stringInQuery: "4",
      },

      headers: {
        numberInHeader: "5",
        stringInHeader: "6",
      },

      body: "",
      req: { path: "/a/1/2" },
    });

    expect(htmlResponse.body).toStrictEqual({
      integerInPath: 1,
      stringInPath: "2",
      numberInQuery: 3,
      stringInQuery: "4",
      numberInHeader: 5,
      stringInHeader: "6",
    });
  });
});

describe("given an invalid path", () => {
  it("returns a 404 when the route is not found", async () => {
    const registry = new Registry();

    registry.add("/your/{side}/{bodyPart}/in/and/your/left/foot/out", {
      PUT() {
        return {
          status: 201,
          body: "ok",
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());

    const response = await dispatcher.request({
      method: "PUT",
      path: "/your/left/foot/in/and/your/right/foot/out",
      body: "",
      req: { path: "/your/left/foot/in/and/your/right/foot/out" },
      query: {},
      headers: {},
    });

    expect(response.status).toBe(404);

    expect(response.body).toBe(
      "Could not find a PUT method matching /your/left/foot/in/and/your/right/foot/out\n"
    );
  });
});
