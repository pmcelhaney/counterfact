import { once } from "node:events";

import { ModuleLoader } from "../src/module-loader.js";
import { Registry } from "../src/registry.js";

import { withTemporaryFiles } from "./lib/with-temporary-files.js";

describe("a module loader", () => {
  it("finds a file and adds it to the registry", async () => {
    const files = {
      "hello.mjs": `
      export function GET() {
          return {
              body: "hello"
          };
      }
      `,
      "a/b/c.mjs": `
        export function GET() {
            return {
                body: "GET from a/b/c"
            }; 
        }
      `,
    };

    await withTemporaryFiles(files, async (basePath) => {
      const registry = new Registry();
      const loader = new ModuleLoader(basePath, registry);

      await loader.load();
      expect(registry.exists("GET", "/hello")).toBe(true);
      expect(registry.exists("POST", "/hello")).toBe(false);
      expect(registry.exists("GET", "/goodbye")).toBe(false);
      expect(registry.exists("GET", "/a/b/c")).toBe(true);
    });
  });
  it("updates the registry when a file is added", async () => {
    await withTemporaryFiles({}, async (basePath, { add }) => {
      const registry = new Registry();
      const loader = new ModuleLoader(basePath, registry);

      await loader.load();
      await loader.watch();
      expect(registry.exists("GET", "/late/addition")).toBe(false);
      void add(
        "late/addition.mjs",
        'export function GET() { return { body: "I\'m here now!" }; }'
      );
      await once(loader, "add");
      expect(registry.exists("GET", "/late/addition")).toBe(true);
      await loader.stopWatching();
    });
  });
  it("updates the registry when a file is deleted", async () => {
    await withTemporaryFiles(
      {
        "delete-me.mjs":
          'export function GET() { return { body: "Goodbye" }; }',
      },
      async (basePath, { remove }) => {
        const registry = new Registry();
        const loader = new ModuleLoader(basePath, registry);

        await loader.load();
        await loader.watch();
        expect(registry.exists("GET", "/delete-me")).toBe(true);
        void remove("delete-me.mjs");
        await once(loader, "remove");
        expect(registry.exists("GET", "/delete-me")).toBe(false);
        await loader.stopWatching();
      }
    );
  });

  // This should work but I can't figure out how to break the
  // module cache when running through Jest (which uses the
  // experimental module API).

  it.skip("updates the registry when a file is changed", async () => {
    await withTemporaryFiles(
      {
        "change.mjs":
          'export function GET() { return { body: "before change" }; }',
      },
      async (basePath, { add }) => {
        const registry = new Registry();
        const loader = new ModuleLoader(basePath, registry);

        await loader.watch();
        void add(
          "change.mjs",
          'export function GET() { return { body: "after change" }; }'
        );
        await once(loader, "change");

        const response = await registry.endpoint(
          "GET",
          "/change"
        )({ path: "", reduce: () => undefined, store: {} });

        expect(response.body).toBe("after change");
        expect(registry.exists("GET", "/late/addition")).toBe(true);
        await loader.stopWatching();
      }
    );
  });
});
