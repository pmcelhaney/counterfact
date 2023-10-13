import { once } from "node:events";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { ModuleLoader } from "../../src/server/module-loader.js";
import { Registry } from "../../src/server/registry.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.js";

describe("a module loader", () => {
  it("finds a file and adds it to the registry", async () => {
    const files: { [fileName: string]: string } = {
      "a/b/c.mjs": `
        export function GET() {
            return {
                body: "GET from a/b/c"
            }; 
        }
      `,
      "hello.mjs": `
      export function GET() {
          return {
              body: "hello"
          };
      }
      `,
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

  it("updates the registry when a file is added", async () => {
    await withTemporaryFiles(
      {},
      async (
        basePath: string,
        { add }: { add: (path: string, content: string) => void },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.load();
        await loader.watch();

        expect(registry.exists("GET", "/late/addition")).toBe(false);

        add(
          "late/addition.mjs",
          'export function GET() { return { body: "I\'m here now!" }; }',
        );
        await once(loader, "add");

        expect(registry.exists("GET", "/late/addition")).toBe(true);

        await loader.stopWatching();
      },
    );
  });

  it("updates the registry when a file is deleted", async () => {
    await withTemporaryFiles(
      {
        "delete-me.mjs":
          'export function GET() { return { body: "Goodbye" }; }',
      },
      async (
        basePath: string,
        { remove }: { remove: (path: string) => void },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.load();
        await loader.watch();

        expect(registry.exists("GET", "/delete-me")).toBe(true);

        remove("delete-me.mjs");
        await once(loader, "remove");

        expect(registry.exists("GET", "/delete-me")).toBe(false);

        await loader.stopWatching();
      },
    );
  });

  it("ignores files with the wrong file extension", async () => {
    const contents = 'export function GET() { return { body: "hello" }; }';

    const files: { [key: string]: string } = {
      "module.mjs": contents,
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
        "change.mjs":
          'export function GET(): { body } { return { body: "before change" }; }',
      },
      async (
        basePath: string,
        { add }: { add: (path: string, content: string) => void },
      ) => {
        const registry: Registry = new Registry();
        const loader: ModuleLoader = new ModuleLoader(basePath, registry);

        await loader.watch();
        add(
          "change.mjs",
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
      "$.context.mjs": 'export default "main"',
      "hello/$.context.mjs": 'export default "hello"',
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

      expect(contextRegistry.find("/hello")).toBe("hello");
      expect(contextRegistry.find("/hello/world")).toBe("hello");
      expect(contextRegistry.find("/some/other/path")).toBe("main");
    });
  });

  it("provides the parent context if the locale $.context.ts doesn't export a default", async () => {
    const files: { [key: string]: string } = {
      "$.context.mjs": "export default { value: 0 }",
      "hello/$.context.mjs": "export default { value: 100 }",
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
