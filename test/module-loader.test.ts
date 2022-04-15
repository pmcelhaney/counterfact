import { Loader } from "../src/loader";
import { Registry } from "../src/registry";

import { withTemporaryFiles } from "./lib/with-temporary-files";

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

      const loader = new Loader(basePath, registry);
      await loader.load();

      expect(registry.exists("GET", "/hello")).toBe(true);
      expect(registry.exists("POST", "/hello")).toBe(false);
      expect(registry.exists("GET", "/goodbye")).toBe(false);
      expect(registry.exists("GET", "/a/b/c")).toBe(true);
    });
  });

  it.todo("updates the registry when a file is changed");

  it.todo("updates the registry when a file is deleted");

  it.todo("updates the registry when a file is added");
});
