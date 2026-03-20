import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "node:fs";
import path from "node:path";

import { pruneRoutes } from "../../src/typescript-generator/prune.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.ts";

describe("pruneRoutes", () => {
  it("removes a route file that is not in the OpenAPI spec", async () => {
    await withTemporaryFiles(
      {
        "routes/pet/{id}.ts": "export const GET = () => ({ status: 200 });",
        "routes/pet/{name}.ts": "export const GET = () => ({ status: 200 });",
      },
      async (basePath, { path: getPath }) => {
        const expectedPaths = ["/pet/{id}"];
        const count = await pruneRoutes(basePath, expectedPaths);

        expect(count).toBe(1);
        await expect(
          fs.access(getPath("routes/pet/{id}.ts")),
        ).resolves.toBeUndefined();
        await expect(
          fs.access(getPath("routes/pet/{name}.ts")),
        ).rejects.toThrow();
      },
    );
  });

  it("keeps context files even when not in the spec", async () => {
    await withTemporaryFiles(
      {
        "routes/_.context.ts": "export class Context {}",
        "routes/pet/_.context.ts": "export class Context {}",
        "routes/pet/{id}.ts": "export const GET = () => ({ status: 200 });",
      },
      async (basePath, { path: getPath }) => {
        const expectedPaths = ["/pet/{id}"];
        const count = await pruneRoutes(basePath, expectedPaths);

        expect(count).toBe(0);
        await expect(
          fs.access(getPath("routes/_.context.ts")),
        ).resolves.toBeUndefined();
        await expect(
          fs.access(getPath("routes/pet/_.context.ts")),
        ).resolves.toBeUndefined();
      },
    );
  });

  it("removes empty directories after pruning", async () => {
    await withTemporaryFiles(
      {
        "routes/old/{id}.ts": "export const GET = () => ({ status: 200 });",
      },
      async (basePath, { path: getPath }) => {
        const expectedPaths = [];
        await pruneRoutes(basePath, expectedPaths);

        await expect(fs.access(getPath("routes/old"))).rejects.toThrow();
      },
    );
  });

  it("does not remove directories that still contain context files", async () => {
    await withTemporaryFiles(
      {
        "routes/old/{id}.ts": "export const GET = () => ({ status: 200 });",
        "routes/old/_.context.ts": "export class Context {}",
      },
      async (basePath, { path: getPath }) => {
        const expectedPaths = [];
        await pruneRoutes(basePath, expectedPaths);

        await expect(fs.access(getPath("routes/old"))).resolves.toBeUndefined();
        await expect(
          fs.access(getPath("routes/old/_.context.ts")),
        ).resolves.toBeUndefined();
      },
    );
  });

  it("handles the root path '/'", async () => {
    await withTemporaryFiles(
      {
        "routes/index.ts": "export const GET = () => ({ status: 200 });",
        "routes/old.ts": "export const GET = () => ({ status: 200 });",
      },
      async (basePath, { path: getPath }) => {
        const expectedPaths = ["/"];
        const count = await pruneRoutes(basePath, expectedPaths);

        expect(count).toBe(1);
        await expect(
          fs.access(getPath("routes/index.ts")),
        ).resolves.toBeUndefined();
        await expect(fs.access(getPath("routes/old.ts"))).rejects.toThrow();
      },
    );
  });

  it("returns 0 when all files match the spec", async () => {
    await withTemporaryFiles(
      {
        "routes/pet/{id}.ts": "export const GET = () => ({ status: 200 });",
        "routes/pet.ts": "export const GET = () => ({ status: 200 });",
      },
      async (basePath) => {
        const expectedPaths = ["/pet/{id}", "/pet"];
        const count = await pruneRoutes(basePath, expectedPaths);

        expect(count).toBe(0);
      },
    );
  });

  it("returns 0 when the routes directory does not exist", async () => {
    await withTemporaryFiles({}, async (basePath) => {
      const count = await pruneRoutes(basePath, ["/pet/{id}"]);

      expect(count).toBe(0);
    });
  });
});
