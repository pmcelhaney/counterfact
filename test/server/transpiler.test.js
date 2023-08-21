import { once } from "node:events";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import { Transpiler } from "../../src/server/transpiler.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.js";

const TYPESCRIPT_SOURCE = "const x:number = 1;\n";
const JAVASCRIPT_SOURCE = "var x = 1;\n";

describe("a Transpiler", () => {
  // eslint-disable-next-line init-declarations
  let transpiler;

  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    transpiler.stopWatching();
  });

  it.only("finds a file and transpiles it", async () => {
    const files = {
      "src/found.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path }) => {
      transpiler = new Transpiler(path("src"), path("dist"));

      await transpiler.watch();

      await expect(fs.readFile(path("dist/found.mjs"), "utf8")).resolves.toBe(
        JAVASCRIPT_SOURCE
      );

      transpiler.stopWatching();
    });
  });

  it("discovers a new file and transpiles it", async () => {
    // on Linux the watcher doesn't seem to work consistently if there's not a file in the directory to begin with

    await withTemporaryFiles(
      { "src/starter.ts": TYPESCRIPT_SOURCE },
      async (basePath, { path, add }) => {
        transpiler = new Transpiler(path("src"), path("dist"));

        await transpiler.watch();

        const write = once(transpiler, "write");

        await add("src/added.ts", TYPESCRIPT_SOURCE);
        await write;

        await expect(fs.readFile(path("dist/added.mjs"), "utf8")).resolves.toBe(
          JAVASCRIPT_SOURCE
        );

        transpiler.stopWatching();
      }
    );
  });

  it("sees an updated file and transpiles it", async () => {
    const files = {
      "src/update-me.ts": "const x = 'code to be overwritten';\n",
    };

    await withTemporaryFiles(files, async (basePath, { path, add }) => {
      transpiler = new Transpiler(path("src"), path("dist"));

      const initialWrite = once(transpiler, "write");

      await transpiler.watch();
      await initialWrite;

      const overwrite = once(transpiler, "write");

      add("src/update-me.ts", TYPESCRIPT_SOURCE);
      await overwrite;

      await expect(
        fs.readFile(path("dist/update-me.mjs"), "utf8")
      ).resolves.toBe(JAVASCRIPT_SOURCE);

      transpiler.stopWatching();
    });
  }, 10_000);

  it("sees a removed TypeScript file and deletes the JavaScript file", async () => {
    const files = {
      "src/delete-me.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path, remove }) => {
      transpiler = new Transpiler(path("src"), path("dist"));

      await transpiler.watch();
      await remove("src/delete-me.ts");
      await once(transpiler, "delete");

      await expect(() =>
        fs.access(path("dist/delete-me.js"), fsConstants.F_OK)
      ).rejects.toThrow(/ENOENT/u);

      transpiler.stopWatching();
    });
  });
});
