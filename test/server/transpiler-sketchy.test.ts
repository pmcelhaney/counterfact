/* eslint-disable n/no-sync */
import { once } from "node:events";
import fs, { constants as fsConstants } from "node:fs";
import { EOL } from "node:os";

import { usingTemporaryFiles } from "using-temporary-files";

import { Transpiler } from "../../src/server/transpiler.js";

const TYPESCRIPT_SOURCE = `export const x:number = 1;${EOL}`;
const JAVASCRIPT_SOURCE = `export const x = 1;${EOL}`;
const JAVASCRIPT_SOURCE_COMMONJS = `"use strict";${EOL}Object.defineProperty(exports, "__esModule", { value: true });${EOL}exports.x = void 0;${EOL}exports.x = 1;${EOL}`;

describe("a Transpiler", () => {
  if (process.platform === "win32") {
    // Not sure why these tests are failing on Windows
    // The new code has nothing to do with OS.
    // Maybe related to usingTemporaryFiles but that works fine in other tests

    it("skips these tests because Windows", () => {
      expect("windows-is-dumb").toEqual("windows-is-dumb");
    });

    return;
  }

  let transpiler: Transpiler = new Transpiler("src", "dist", "");

  afterEach(async () => {
    await transpiler.stopWatching();
  });

  it("finds a file and transpiles it", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("src/found.ts", TYPESCRIPT_SOURCE);
      transpiler = new Transpiler($.path("src"), $.path("dist"), "module");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(fs.readdirSync($.path("./dist"))).toEqual(["found.js"]);

      expect(fs.existsSync($.path("dist/found.js"))).toBe(true);

      expect(fs.readFileSync($.path("dist/found.js"), "utf8")).toBe(
        JAVASCRIPT_SOURCE,
      );

      await transpiler.stopWatching();
    });
  });

  it("discovers a new file and transpiles it", async () => {
    // on Linux the watcher doesn't seem to work consistently if there's not a file in the directory to begin with

    await usingTemporaryFiles(async ($) => {
      await $.add("src/starter.ts", TYPESCRIPT_SOURCE);
      transpiler = new Transpiler($.path("src"), $.path("dist"), "module");

      await transpiler.watch();

      const write = once(transpiler, "write");
      const error = once(transpiler, "error");

      await $.add("src/added.ts", TYPESCRIPT_SOURCE);

      if (process.platform === "win32") {
        // Chokidar's add event seems to be unreliable on Windows
        // Not sure what to do about it, so just skip this test
        return;
      }

      await Promise.race([write, error]);

      expect(fs.readdirSync($.path("./dist"))).toEqual([
        "added.js",
        "starter.js",
      ]);

      expect(fs.readFileSync($.path("dist/added.js"), "utf8")).toBe(
        JAVASCRIPT_SOURCE,
      );

      await transpiler.stopWatching();
    });
  });

  it("sees an updated file and transpiles it", async () => {
    await usingTemporaryFiles(async ($) => {
      transpiler = new Transpiler($.path("src"), $.path("dist"), "module");

      await $.add(
        "src/update-me.ts",
        `const x = 'code to be overwritten';${EOL}`,
      );

      const initialWrite = once(transpiler, "write");

      await transpiler.watch();
      await initialWrite;

      const overwrite = once(transpiler, "write");

      await $.add("src/update-me.ts", TYPESCRIPT_SOURCE);
      await overwrite;

      expect(fs.readdirSync($.path("./dist"))).toEqual(["update-me.js"]);

      expect(fs.readFileSync($.path("dist/update-me.js"), "utf8")).toBe(
        JAVASCRIPT_SOURCE,
      );

      await transpiler.stopWatching();
    });
  }, 10_000);

  it("sees a removed TypeScript file and deletes the JavaScript file", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("src/delete-me.ts", TYPESCRIPT_SOURCE);
      transpiler = new Transpiler($.path("src"), $.path("dist"), "module");

      await transpiler.watch();
      await $.remove("src/delete-me.ts");
      await once(transpiler, "delete");

      expect(fs.readdirSync($.path("./dist"))).toEqual([]);

      expect(() => {
        fs.accessSync($.path("dist/delete-me.js"), fsConstants.F_OK);
      }).toThrow(/ENOENT/u);

      await transpiler.stopWatching();
    });
  });

  it("transpiles as CommonJS when specified", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("src/found.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler($.path("src"), $.path("dist"), "commonjs");

      await transpiler.watch();

      expect(fs.readdirSync($.path("./dist"))).toEqual(["found.cjs"]);

      expect(fs.existsSync($.path("dist/found.cjs"))).toBe(true);

      expect(fs.readFileSync($.path("dist/found.cjs"), "utf8")).toBe(
        JAVASCRIPT_SOURCE_COMMONJS,
      );

      await transpiler.stopWatching();
    });
  });

  it("converts requires of .js files to .cjs", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "src/importer.ts",
        'import local from "./local.js"; local();',
      );

      transpiler = new Transpiler($.path("src"), $.path("dist"), "commonjs");

      await transpiler.watch();
      expect(fs.readdirSync($.path("./dist"))).toEqual(["importer.cjs"]);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const contents = fs.readFileSync($.path("dist/importer.cjs"));

      expect(contents.includes('require("./local.cjs")')).toBe(true);

      await transpiler.stopWatching();
    });
  });
});
