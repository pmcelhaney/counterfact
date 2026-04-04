/* eslint-disable @typescript-eslint/no-explicit-any */
import { once } from "node:events";

import { usingTemporaryFiles } from "using-temporary-files";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { ModuleLoader } from "../../src/server/module-loader.js";
import { MiddlewareFunction, Registry } from "../../src/server/registry.js";

describe("a module loader", () => {
  it("finds a file and adds it to the registry", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "a/b/c.js",
        `export function GET() {
          return {
              body: "GET from a/b/c"
          }; 
      }`,
      );

      await $.add(
        "hello.js",
        `
      export function GET() {
          return {
              body: "hello"
          };
      }`,
      );

      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path(""), registry);

      await loader.load();

      expect(registry.exists("GET", "/hello")).toBe(true);
      expect(registry.exists("POST", "/hello")).toBe(false);
      expect(registry.exists("GET", "/goodbye")).toBe(false);
      expect(registry.exists("GET", "/a/b/c")).toBe(true);
    });
  });

  it("maps /index to /", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "index.js",
        `export function GET() {
          return {
              body: "GET from a/b/c"
          }; 
      }`,
      );

      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path(""), registry);

      await loader.load();

      expect(registry.exists("GET", "/index")).toBe(true);
      expect(registry.exists("GET", "/")).toBe(true);
    });
  });

  it("updates the registry when a file is deleted", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "delete-me.js",
        'export function GET() { return { body: "Goodbye" }; }',
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path("."), registry);

      await loader.load();
      await loader.watch();

      expect(registry.exists("GET", "/delete-me")).toBe(true);

      await $.remove("delete-me.js");
      await once(loader, "remove");

      expect(registry.exists("GET", "/delete-me")).toBe(false);

      await loader.stopWatching();
    });
  });

  it("does not crash when a context file is deleted", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("_.context.js", "export class Context { value = 42 }");
      await $.add(
        "hello.js",
        'export function GET() { return { body: "hello" }; }',
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path("."), registry);

      await loader.load();
      await loader.watch();

      await $.remove("_.context.js");
      await once(loader, "remove");

      // Should not crash and the route should still be accessible
      expect(registry.exists("GET", "/hello")).toBe(true);

      await loader.stopWatching();
    });
  });

  it("ignores files with the wrong file extension", async () => {
    await usingTemporaryFiles(async ($) => {
      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path("."), registry);

      await $.add(
        "module.js",
        'export function GET() { return { body: "hello" }; }',
      );
      await $.add("package.json", '{"type": "module"}');
      await $.add("README.md", "readme");

      await loader.load();
      await loader.watch();

      await $.add("other.txt", "should not be loaded");

      expect(registry.exists("GET", "/module")).toBe(true);
      expect(registry.exists("GET", "/READMEx")).toBe(false);
      expect(registry.exists("GET", "/other")).toBe(false);
      expect(registry.exists("GET", "/types")).toBe(false);

      await loader.stopWatching();
    });
  });

  // This should work but I can't figure out how to break the
  // module cache when running through Jest (which uses the
  // experimental module API).

  it.skip("updates the registry when a file is changed", async () => {
    await usingTemporaryFiles(async ($) => {
      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path("."), registry);

      await $.add(
        "change.js",
        'export function GET(): { body } { return { body: "before change" }; }',
      );
      await $.add("package.json", '{ "type": "module" }');

      await loader.watch();
      await $.add(
        "change.js",
        'export function GET() { return { body: "after change" }; }',
      );
      await once(loader, "change");

      const response = registry.endpoint(
        "GET",
        "/change",

        // @ts-expect-error - not going to create a whole context object for a test
      )({ headers: {}, matchedPath: "", path: {}, query: {} });

      // @ts-expect-error - TypeScript doesn't know that the response will have a body property
      expect(response.body).toBe("after change");
      expect(registry.exists("GET", "/late/addition")).toBe(true);

      await loader.stopWatching();
    });
  });

  it("finds a context and adds it to the context registry", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("_.context.js", 'export class Context { name = "main"};');
      await $.add(
        "hello/_.context.js",
        'export class Context { name = "hello"};',
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();

      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
      );

      await loader.load();

      expect(contextRegistry.find("/hello").name).toBe("hello");
      expect(contextRegistry.find("/hello/world").name).toBe("hello");
      expect(contextRegistry.find("/some/other/path").name).toBe("main");
    });
  });

  it("finds a middleware and adds it to the registry", async () => {
    const names = new Map();
    class MiddlewareExposingRegistry extends Registry {
      public addMiddleware(url: string, callback: MiddlewareFunction): void {
        names.set(
          url,
          // @ts-expect-error not passing arguments to the callback
          callback(),
        );
      }
    }

    await usingTemporaryFiles(async ($) => {
      await $.add(
        "_.middleware.js",
        'export function middleware() { return "root"; }',
      );
      await $.add(
        "hello/_.middleware.js",
        'export function middleware() { return "hello"; }',
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new MiddlewareExposingRegistry();

      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
      );

      await loader.load();

      expect(names.get("/")).toBe("root");
      expect(names.get("/hello")).toBe("hello");
    });
  });

  it("provides the parent context if the local _.context.ts doesn't export a default", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("_.context.js", "export class Context { value = 0 }");
      await $.add(
        "hello/_.context.js",
        "export class Context  { value =  100 }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();

      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),

        registry,
        contextRegistry,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/");
      const helloContext = contextRegistry.find("/hello");

      rootContext.value = 1;
      helloContext.value = 101;

      expect(contextRegistry.find("/").value).toBe(1);
      expect(contextRegistry.find("/other").value).toBe(1);
      expect(contextRegistry.find("/hello").value).toBe(101);
      expect(contextRegistry.find("/hello/world").value).toBe(101);
    });
  });

  it("provides the loadContext helper for accessing nested contexts", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "_.context.js",
        "export class Context  { constructor({loadContext}) { this.loadContext = loadContext } }",
      );
      await $.add("a/_.context.js", "export class Context  { name = 'a' }");
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();

      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),

        registry,
        contextRegistry,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/") as any;

      expect(rootContext?.loadContext("/a")?.name).toBe("a");
    });
  });

  it("provides readJson for reading JSON files relative to the context file", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("data.json", '{"name": "test", "value": 42}');
      await $.add(
        "_.context.js",
        "export class Context { constructor({ readJson }) { this.readJson = readJson; } }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/") as any;
      const data = await rootContext.readJson("./data.json");

      expect(data).toEqual({ name: "test", value: 42 });
    });
  });

  it("resolves readJson paths relative to the context file's directory", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("shared/data.json", '{"shared": true}');
      await $.add(
        "sub/_.context.js",
        "export class Context { constructor({ readJson }) { this.readJson = readJson; } }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
      );

      await loader.load();

      const subContext = contextRegistry.find("/sub") as any;
      const data = await subContext.readJson("../shared/data.json");

      expect(data).toEqual({ shared: true });
    });
  });

  it("passes openApiDocument to the Context constructor", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "_.context.js",
        "export class Context { constructor({ openApiDocument }) { this.openApiDocument = openApiDocument; } }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const contextRegistry: ContextRegistry = new ContextRegistry();
      const openApiDocument = { paths: { "/hello": {} } };

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
        openApiDocument,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/") as any;

      expect(rootContext?.openApiDocument.paths).toEqual({ "/hello": {} });
    });
  });

  it("defaults openApiDocument to an empty object when none is provided", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "_.context.js",
        "export class Context { constructor({ openApiDocument }) { this.openApiDocument = openApiDocument; } }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/") as any;

      expect(rootContext?.openApiDocument).toBeDefined();
      expect(typeof rootContext?.openApiDocument).toBe("object");
    });
  });

  it("setOpenApiDocument works even when no initial document was provided", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "_.context.js",
        "export class Context { constructor({ openApiDocument }) { this.openApiDocument = openApiDocument; } }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/") as any;
      const capturedReference = rootContext?.openApiDocument;

      loader.setOpenApiDocument({ paths: { "/added": {} } });

      expect(rootContext?.openApiDocument).toBe(capturedReference);
      expect(rootContext?.openApiDocument.paths).toEqual({ "/added": {} });
    });
  });

  it("updates the openApiDocument reference in-place when setOpenApiDocument is called", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "_.context.js",
        "export class Context { constructor({ openApiDocument }) { this.openApiDocument = openApiDocument; } }",
      );
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const contextRegistry: ContextRegistry = new ContextRegistry();
      const openApiDocument = { paths: { "/hello": {} } };

      const loader: ModuleLoader = new ModuleLoader(
        $.path("."),
        registry,
        contextRegistry,
        openApiDocument,
      );

      await loader.load();

      const rootContext = contextRegistry.find("/") as any;

      // Capture the proxy reference — it should remain stable
      const capturedReference = rootContext?.openApiDocument;

      const updatedDocument = { paths: { "/goodbye": {} } };
      loader.setOpenApiDocument(updatedDocument);

      // The proxy reference is stable
      expect(rootContext?.openApiDocument).toBe(capturedReference);
      // But the data it reads reflects the new document
      expect(rootContext?.openApiDocument.paths).toEqual({ "/goodbye": {} });
      expect(rootContext?.openApiDocument.paths["/hello"]).toBeUndefined();
    });
  });

  // can't test because I can't get Jest to refresh modules
  it.skip("updates the registry when a dependency is updated", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("package.json", '{ "type": "module" }');

      await $.add("x.js", 'export const x = "original";');

      await $.add(
        "main.js",
        'import { x } from "./x.js"; export function GET() { return x; }',
      );

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path("."), registry);

      await loader.load();
      await loader.watch();

      // @ts-expect-error - not going to create a whole request object for a test
      const response = await registry.endpoint("GET", "/main")({});

      await $.add("x.js", 'export const x = "changed";');

      await once(loader, "add");

      expect(response).toEqual("changed");

      await loader.stopWatching();
    });
  });

  it("registers a 500 handler for an ESM route file with a syntax error", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("bad-syntax.js", "this is not valid javascript @@@");
      await $.add("package.json", '{ "type": "module" }');

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path(""), registry);

      await loader.load();

      expect(registry.exists("GET", "/bad-syntax")).toBe(true);

      // @ts-expect-error - not going to create a whole request object for a test
      const response = await registry.endpoint("GET", "/bad-syntax")({});

      expect(response?.status).toBe(500);
      expect(response?.body).toContain("bad-syntax.js");
    });
  });

  it("registers a 500 handler for a CJS route file with a syntax error", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("bad-syntax.cjs", "this is not valid javascript @@@");

      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader($.path(""), registry);

      await loader.load();

      expect(registry.exists("GET", "/bad-syntax")).toBe(true);

      // @ts-expect-error - not going to create a whole request object for a test
      const response = await registry.endpoint("GET", "/bad-syntax")({});

      expect(response?.status).toBe(500);
      expect(response?.body).toContain("bad-syntax.cjs");
      expect(response?.body).toContain("syntax error");
    });
  });
});
