import { once } from "node:events";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { ModuleLoader } from "../../src/server/module-loader.js";
import { Registry } from "../../src/server/registry.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.js";

describe("a module loader", () => {
  it("finds a file and adds it to the registry", async () => {
    const files: { [fileName: string]: string } = {
      "a/b/c.js": `
        export function GET() {
            return {
                body: "GET from a/b/c"
            }; 
        }
      `,

      "hello.js": `
      export function GET() {
          return {
              body: "hello"
          };
      }
      `,
      "package.json": '{ "type": "module" }',
    };

    await withTemporaryFiles(files, async (basePath: string) => {
      const registry: Registry = new Registry();
      const loader: ModuleLoader = new ModuleLoader(basePath, registry);

      await loader.load();

      expect(registry.exists("GET", "/hello")).toBe(true);
      expect(registry.exists("POST", "/hello")).toBe(false);
      expect(registry.exists("GET", "/goodbye")).toBe(false);
      expect(registry.exists("GET", "/a/b/c")).toBe(true);
    });
  });

  it("clears out an preexisting files", async () => {
    const files: { [fileName: string]: string } = {
      "hello.js": `
      export function GET() {
          return {
              body: "hello"
          };
      }
      `,
      "package.json": '{ "type": "module" }',
    };

    await withTemporaryFiles(
      files,
      async (
        basePath: string,
        { remove }: { remove: (path: string) => Promise<void> },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.load();

        await remove("hello.js");

        await loader.load();

        expect(registry.exists("GET", "/hello")).toBe(false);
      },
    );
  });

  it("updates the registry when a file is added", async () => {
    await withTemporaryFiles(
      { "package.json": '{ "type": "module" }' },
      async (
        basePath: string,
        { add }: { add: (path: string, content: string) => Promise<void> },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.load();
        await loader.watch();

        expect(registry.exists("GET", "/late/addition")).toBe(false);

        await add(
          "late/addition.js",
          'export function GET() { return { body: "I\'m here now!" }; }',
        );
        await once(loader, "load");

        expect(registry.exists("GET", "/late/addition")).toBe(true);

        await loader.stopWatching();
      },
    );
  });

  it("updates the registry when a file is deleted", async () => {
    await withTemporaryFiles(
      {
        "delete-me.js": 'export function GET() { return { body: "Goodbye" }; }',

        "package.json": '{ "type": "module" }',
      },
      async (
        basePath: string,
        { remove }: { remove: (path: string) => Promise<void> },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.load();
        await loader.watch();

        expect(registry.exists("GET", "/delete-me")).toBe(true);

        await remove("delete-me.js");

        await once(loader, "load");

        expect(registry.exists("GET", "/delete-me")).toBe(false);

        await loader.stopWatching();
      },
    );
  });

  it("ignores files with the wrong file extension", async () => {
    const contents = 'export function GET() { return { body: "hello" }; }';

    const files: { [key: string]: string } = {
      "module.js": contents,
      "package.json": '{"type": "module"}',
      "README.md": contents,
    };

    await withTemporaryFiles(
      files,
      async (
        basePath: string,
        { add }: { add: (path: string, content: string) => void },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.load();
        await loader.watch();

        add("other.txt", "should not be loaded");

        expect(registry.exists("GET", "/module")).toBe(true);
        expect(registry.exists("GET", "/READMEx")).toBe(false);
        expect(registry.exists("GET", "/other")).toBe(false);
        expect(registry.exists("GET", "/types")).toBe(false);

        await loader.stopWatching();
      },
    );
  });

  // This should work but I can't figure out how to break the
  // module cache when running through Jest (which uses the
  // experimental module API).

  it.skip("updates the registry when a file is changed", async () => {
    await withTemporaryFiles(
      {
        "change.js":
          'export function GET(): { body } { return { body: "before change" }; }',

        "package.json": '{ "type": "module" }',
      },
      async (
        basePath: string,
        { add }: { add: (path: string, content: string) => void },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.watch();
        add(
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
      },
    );
  });

  it("finds a context and adds it to the context registry", async () => {
    const files: { [key: string]: string } = {
      "_.context.js": 'export class Context { name = "main"};',
      "hello/_.context.js": 'export class Context { name = "hello"};',
      "package.json": '{ "type": "module" }',
    };

    await withTemporaryFiles(files, async (basePath: string) => {
      const registry: Registry = new Registry();

      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        basePath,
        registry,
        contextRegistry,
      );

      await loader.load();

      expect(contextRegistry.find("/hello").name).toBe("hello");
      expect(contextRegistry.find("/hello/world").name).toBe("hello");
      expect(contextRegistry.find("/some/other/path").name).toBe("main");
    });
  });

  it("provides the parent context if the locale _.context.ts doesn't export a default", async () => {
    const files: { [key: string]: string } = {
      "_.context.js": "export class Context { value = 0 }",
      "hello/_.context.js": "export class Context  { value =  100 }",
      "package.json": '{ "type": "module" }',
    };

    await withTemporaryFiles(files, async (basePath: string) => {
      const registry: Registry = new Registry();

      const contextRegistry: ContextRegistry = new ContextRegistry();

      const loader: ModuleLoader = new ModuleLoader(
        basePath,
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
});
