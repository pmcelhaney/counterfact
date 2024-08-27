/* eslint-disable n/no-sync */
import { once } from "node:events";
import fs, { constants as fsConstants } from "node:fs";
import { EOL } from "node:os";

import { Transpiler } from "../../src/server/transpiler.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.js";

const TYPESCRIPT_SOURCE = `export const x:number = 1;${EOL}`;
const JAVASCRIPT_SOURCE = `export const x = 1;${EOL}`;
const JAVASCRIPT_SOURCE_COMMONJS = `"use strict";${EOL}Object.defineProperty(exports, "__esModule", { value: true });${EOL}exports.x = void 0;${EOL}exports.x = 1;${EOL}`;

describe("a Transpiler", () => {
  let transpiler: Transpiler = new Transpiler("src", "dist", "");

  afterEach(async () => {
    await transpiler.stopWatching();
  });

  it("finds a file and transpiles it", async () => {
    const files = {
      "src/found.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path }) => {
      transpiler = new Transpiler(path("src"), path("dist"), "module");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(fs.existsSync(path("dist/found.js"))).toBe(true);

      expect(fs.readFileSync(path("dist/found.js"), "utf8")).toBe(
        JAVASCRIPT_SOURCE,
      );

      await transpiler.stopWatching();
    });
  });

  it("discovers a new file and transpiles it", async () => {
    // on Linux the watcher doesn't seem to work consistently if there's not a file in the directory to begin with

    await withTemporaryFiles(
      { "src/starter.ts": TYPESCRIPT_SOURCE },
      async (basePath, { add, path }) => {
        transpiler = new Transpiler(path("src"), path("dist"), "module");

        await transpiler.watch();

        const write = once(transpiler, "write");
        const error = once(transpiler, "error");

        await add("src/added.ts", TYPESCRIPT_SOURCE);

        if (process.platform === "win32") {
          // Chokidar's add event seems to be unreliable on Windows
          // Not sure what to do about it, so just skip this test
          return;
        }

        await Promise.race([write, error]);

        expect(fs.readFileSync(path("dist/added.js"), "utf8")).toBe(
          JAVASCRIPT_SOURCE,
        );

        await transpiler.stopWatching();
      },
    );
  });

  it("sees an updated file and transpiles it", async () => {
    const files = {
      "src/update-me.ts": "const x = 'code to be overwritten';\n",
    };

    await withTemporaryFiles(files, async (basePath, { add, path }) => {
      transpiler = new Transpiler(path("src"), path("dist"), "module");

      const initialWrite = once(transpiler, "write");

      await transpiler.watch();
      await initialWrite;

      const overwrite = once(transpiler, "write");

      await add("src/update-me.ts", TYPESCRIPT_SOURCE);
      await overwrite;

      expect(fs.readFileSync(path("dist/update-me.js"), "utf8")).toBe(
        JAVASCRIPT_SOURCE,
      );

      await transpiler.stopWatching();
    });
  }, 10_000);

  it("sees a removed TypeScript file and deletes the JavaScript file", async () => {
    const files = {
      "src/delete-me.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path, remove }) => {
      transpiler = new Transpiler(path("src"), path("dist"), "module");

      await transpiler.watch();
      await remove("src/delete-me.ts");
      await once(transpiler, "delete");

      expect(() => {
        fs.accessSync(path("dist/delete-me.js"), fsConstants.F_OK);
      }).toThrow(/ENOENT/u);

      await transpiler.stopWatching();
    });
  });

  it("transpiles as CommonJS when specified", async () => {
    const files = {
      "src/found.ts": TYPESCRIPT_SOURCE,
    };

    await withTemporaryFiles(files, async (basePath, { path }) => {
      transpiler = new Transpiler(path("src"), path("dist"), "commonjs");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(fs.existsSync(path("dist/found.cjs"))).toBe(true);

      expect(fs.readFileSync(path("dist/found.cjs"), "utf8")).toBe(
        JAVASCRIPT_SOURCE_COMMONJS,
      );

      await transpiler.stopWatching();
    });
  });
});
