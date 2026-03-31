import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "node:fs";

import { usingTemporaryFiles } from "using-temporary-files";

import { pruneRoutes } from "../../src/typescript-generator/prune.js";

describe("pruneRoutes", () => {
  it("removes a route file that is not in the OpenAPI spec", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "routes/pet/{id}.ts",
        "export const GET = () => ({ status: 200 });",
      );
      await $.add(
        "routes/pet/{name}.ts",
        "export const GET = () => ({ status: 200 });",
      );

      const expectedPaths = ["/pet/{id}"];
      const count = await pruneRoutes($.path(""), expectedPaths);

      expect(count).toBe(1);
      await expect(
        fs.access($.path("routes/pet/{id}.ts")),
      ).resolves.toBeUndefined();
      await expect(fs.access($.path("routes/pet/{name}.ts"))).rejects.toThrow();
    });
  });

  it("keeps context files even when not in the spec", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("routes/_.context.ts", "export class Context {}");
      await $.add("routes/pet/_.context.ts", "export class Context {}");
      await $.add(
        "routes/pet/{id}.ts",
        "export const GET = () => ({ status: 200 });",
      );

      const expectedPaths = ["/pet/{id}"];
      const count = await pruneRoutes($.path(""), expectedPaths);

      expect(count).toBe(0);
      await expect(
        fs.access($.path("routes/_.context.ts")),
      ).resolves.toBeUndefined();
      await expect(
        fs.access($.path("routes/pet/_.context.ts")),
      ).resolves.toBeUndefined();
    });
  });

  it("removes empty directories after pruning", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "routes/old/{id}.ts",
        "export const GET = () => ({ status: 200 });",
      );

      const expectedPaths = [];
      await pruneRoutes($.path(""), expectedPaths);

      await expect(fs.access($.path("routes/old"))).rejects.toThrow();
    });
  });

  it("does not remove directories that still contain context files", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "routes/old/{id}.ts",
        "export const GET = () => ({ status: 200 });",
      );
      await $.add("routes/old/_.context.ts", "export class Context {}");

      const expectedPaths = [];
      await pruneRoutes($.path(""), expectedPaths);

      await expect(fs.access($.path("routes/old"))).resolves.toBeUndefined();
      await expect(
        fs.access($.path("routes/old/_.context.ts")),
      ).resolves.toBeUndefined();
    });
  });

  it("handles the root path '/'", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "routes/index.ts",
        "export const GET = () => ({ status: 200 });",
      );
      await $.add(
        "routes/old.ts",
        "export const GET = () => ({ status: 200 });",
      );

      const expectedPaths = ["/"];
      const count = await pruneRoutes($.path(""), expectedPaths);

      expect(count).toBe(1);
      await expect(
        fs.access($.path("routes/index.ts")),
      ).resolves.toBeUndefined();
      await expect(fs.access($.path("routes/old.ts"))).rejects.toThrow();
    });
  });

  it("returns 0 when all files match the spec", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "routes/pet/{id}.ts",
        "export const GET = () => ({ status: 200 });",
      );
      await $.add(
        "routes/pet.ts",
        "export const GET = () => ({ status: 200 });",
      );

      const expectedPaths = ["/pet/{id}", "/pet"];
      const count = await pruneRoutes($.path(""), expectedPaths);

      expect(count).toBe(0);
    });
  });

  it("returns 0 when the routes directory does not exist", async () => {
    await usingTemporaryFiles(async ($) => {
      const count = await pruneRoutes($.path(""), ["/pet/{id}"]);

      expect(count).toBe(0);
    });
  });
});
