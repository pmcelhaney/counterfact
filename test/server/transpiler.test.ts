import { once } from "node:events";

import { usingTemporaryFiles } from "using-temporary-files";

import { Transpiler } from "../../src/server/transpiler.js";

// The Transpiler internally uses string replacement on paths after normalizing
// chokidar paths to forward slashes, so root paths must also use forward slashes
// (especially on Windows where nodePath.join uses backslashes).
function forwardSlash(p: string): string {
  return p.replaceAll("\\", "/");
}

const TYPESCRIPT_SOURCE = `export const x:number = 1;\n`;
const JAVASCRIPT_SOURCE = `export const x = 1;\n`;
const JAVASCRIPT_SOURCE_COMMONJS = `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.x = void 0;\nexports.x = 1;\n`;

function normalize(fileContents: string) {
  return fileContents
    .replace(/^\uFEFF/u, "") // strip BOM if present
    .replace(/\r\n/g, "\n") // normalize CRLF
    .replace(/\r/g, "\n") // normalize lone CR
    .trimEnd();
}

describe("a Transpiler", () => {
  // rootPath is the base directory; the Transpiler watches rootPath/routes/
  // and compiles to rootPath/.cache/
  let transpiler: Transpiler = new Transpiler("root", "");

  afterEach(async () => {
    await transpiler.stopWatching();
  });

  it("finds a file and transpiles it", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("root/routes/found.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler(forwardSlash($.path("root")), "module");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(normalize(await $.read("root/.cache/found.js"))).toBe(
        normalize(JAVASCRIPT_SOURCE),
      );

      await transpiler.stopWatching();
    });
  });

  it("discovers a new file and transpiles it", async () => {
    // on Linux the watcher doesn't seem to work consistently if there's not a file in the directory to begin with

    await usingTemporaryFiles(async ($) => {
      await $.add("root/routes/starter.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler(forwardSlash($.path("root")), "module");

      await transpiler.watch();

      const write = once(transpiler, "write");
      const error = once(transpiler, "error");

      await $.add("root/routes/added.ts", TYPESCRIPT_SOURCE);

      if (process.platform === "win32") {
        // Chokidar's add event seems to be unreliable on Windows
        // Not sure what to do about it, so just skip this test
        return;
      }

      await Promise.race([write, error]);

      expect(normalize(await $.read("root/.cache/added.js"))).toBe(
        normalize(JAVASCRIPT_SOURCE),
      );

      await transpiler.stopWatching();
    });
  });

  it("sees an updated file and transpiles it", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "root/routes/update-me.ts",
        "const x = 'code to be overwritten';\n",
      );

      transpiler = new Transpiler(forwardSlash($.path("root")), "module");

      const initialWrite = once(transpiler, "write");

      await transpiler.watch();
      await initialWrite;

      const overwrite = once(transpiler, "write");

      await $.add("root/routes/update-me.ts", TYPESCRIPT_SOURCE);
      await overwrite;

      expect(normalize(await $.read("root/.cache/update-me.js"))).toBe(
        normalize(JAVASCRIPT_SOURCE),
      );

      await transpiler.stopWatching();
    });
  }, 10_000);

  it("sees a removed TypeScript file and deletes the JavaScript file", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("root/routes/delete-me.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler(forwardSlash($.path("root")), "module");

      await transpiler.watch();
      await $.remove("root/routes/delete-me.ts");
      await once(transpiler, "delete");

      await expect($.read("root/.cache/delete-me.js")).rejects.toThrow(
        /ENOENT/u,
      );

      await transpiler.stopWatching();
    });
  });

  it("transpiles as CommonJS when specified", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("root/routes/found.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler(forwardSlash($.path("root")), "commonjs");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(normalize(await $.read("root/.cache/found.cjs"))).toBe(
        normalize(JAVASCRIPT_SOURCE_COMMONJS),
      );

      await transpiler.stopWatching();
    });
  });

  it("converts requires of .js files to .cjs", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "root/routes/importer.ts",
        'import local from "./local.js"; local();',
      );

      transpiler = new Transpiler(forwardSlash($.path("root")), "commonjs");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const contents = await $.read("root/.cache/importer.cjs");

      expect(contents.includes('require("./local.cjs")')).toBe(true);

      await transpiler.stopWatching();
    });
  });

  it("ignores files outside of a routes/ directory", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("root/types/ignored.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler(forwardSlash($.path("root")), "commonjs");

      // watch() resolves after the initial scan is complete, so if no
      // compilation was triggered for files outside routes/ by now, none will be.
      await transpiler.watch();

      await expect($.read("root/.cache/ignored.cjs")).rejects.toThrow(
        /ENOENT/u,
      );

      await transpiler.stopWatching();
    });
  });

  it("covers multiple specs under the same root", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("root/alpha/routes/ping.ts", TYPESCRIPT_SOURCE);
      await $.add("root/beta/routes/items.ts", TYPESCRIPT_SOURCE);

      transpiler = new Transpiler(forwardSlash($.path("root")), "commonjs");

      await transpiler.watch();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(normalize(await $.read("root/alpha/.cache/ping.cjs"))).toBe(
        normalize(JAVASCRIPT_SOURCE_COMMONJS),
      );
      expect(normalize(await $.read("root/beta/.cache/items.cjs"))).toBe(
        normalize(JAVASCRIPT_SOURCE_COMMONJS),
      );

      await transpiler.stopWatching();
    });
  });
});
