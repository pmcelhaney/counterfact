import { once } from "node:events";

import { usingTemporaryFiles } from "using-temporary-files";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { ModuleLoader } from "../../src/server/module-loader.js";
import { Registry } from "../../src/server/registry.js";

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

  it("provides the parent context if the local _.context.ts doesn't export a default", async () => {
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

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const rootContext = contextRegistry.find("/") as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      expect(rootContext?.loadContext("/a")?.name).toBe("a");
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
});
