import { once } from "node:events";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import { Transpiler } from "../src/transpiler.js";

import { withTemporaryFiles } from "./lib/with-temporary-files.js";

const TYPESCRIPT_SOURCE = "const x:number = 1;\n";
const JAVASCRIPT_SOURCE = "var x = 1;\n";

describe("a Transpiler", () => {
  it("finds a file and transpiles it", async () => {
    const files = {
      "src/found.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path }) => {
      const transpiler = new Transpiler(path("src"), path("dist"));

      await transpiler.watch();
      await once(transpiler, "write");

      await expect(fs.readFile(path("dist/found.js"), "utf8")).resolves.toBe(
        JAVASCRIPT_SOURCE
      );
    });
  });

  it("discovers a new file and transpiles it", async () => {
    await withTemporaryFiles({}, async (basePath, { path, add }) => {
      const transpiler = new Transpiler(path("src"), path("dist"));

      await transpiler.watch();
      add("src/added.ts", TYPESCRIPT_SOURCE);
      await once(transpiler, "write");

      await expect(fs.readFile(path("dist/added.js"), "utf8")).resolves.toBe(
        JAVASCRIPT_SOURCE
      );
    });
  });

  it("sees an updated file and transpiles it", async () => {
    const files = {
      "src/update-me.ts": "const x = 'code to be overwritten';\n",
    };

    await withTemporaryFiles(files, async (basePath, { path, add }) => {
      const transpiler = new Transpiler(path("src"), path("dist"));

      await transpiler.watch();
      add("src/update-me.ts", TYPESCRIPT_SOURCE);
      await once(transpiler, "write");

      await expect(
        fs.readFile(path("dist/update-me.js"), "utf8")
      ).resolves.toBe(JAVASCRIPT_SOURCE);
    });
  });

  it("sees a removed TypeScript file and deletes the JavaScript file", async () => {
    const files = {
      "src/delete-me.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path, remove }) => {
      const transpiler = new Transpiler(path("src"), path("dist"));

      await transpiler.watch();
      await once(transpiler, "write");
      await remove("src/delete-me.ts");
      await once(transpiler, "delete");

      await expect(() =>
        fs.access(path("dist/delete-me.js"), fsConstants.F_OK)
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
