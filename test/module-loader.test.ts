import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Loader } from "../src/loader";
import { Registry } from "../src/registry";

describe("a module loader", () => {
  it("finds a file and adds it to the registry", async () => {
    let basePath = "";

    try {
      basePath = await fs.mkdtemp(path.join(os.tmpdir(), "counterfact-"));

      await fs.writeFile(
        path.join(basePath, "hello.mjs"),
        `
          export function GET() {
              return {
                  body: "hello"
              };
          }
      `
      );

      await fs.mkdir(path.join(basePath, "a"));
      await fs.mkdir(path.join(basePath, "a/b"));
      await fs.writeFile(
        path.join(basePath, "a/b/c.mjs"),
        `
          export function GET() {
              return {
                  body: "GET from a/b/c"
              }; 
          }
      `
      );

      const registry = new Registry();

      const loader = new Loader(basePath, registry);
      await loader.load();

      expect(registry.exists("GET", "hello")).toBe(true);
      expect(registry.exists("POST", "hello")).toBe(false);
      expect(registry.exists("GET", "goodbye")).toBe(false);
      expect(registry.exists("GET", "a/b/c")).toBe(true);
    } finally {
      await fs.rm(basePath, {
        recursive: true,
      });
    }
  });

  it.todo("updates the registry when a file is changed");

  it.todo("updates the registry when a file is deleted");

  it.todo("updates the registry when a file is added");
});
