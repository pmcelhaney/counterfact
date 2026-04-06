import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath from "node:path";

import { escapePathForWindows } from "../util/windows-escape.js";

const JS_EXTENSIONS = new Set(["cjs", "cts", "js", "mjs", "mts", "ts"]);

export class FileDiscovery {
  private readonly basePath: string;

  public constructor(basePath: string) {
    this.basePath = basePath;
  }

  public async findFiles(directory = ""): Promise<string[]> {
    const fullDir = nodePath
      .join(this.basePath, directory)
      .replaceAll("\\", "/");

    if (!existsSync(fullDir)) {
      throw new Error(`Directory does not exist ${fullDir}`);
    }

    const entries = await fs.readdir(fullDir, { withFileTypes: true });

    const results = await Promise.all(
      entries.map(async (entry) => {
        if (entry.isDirectory()) {
          return this.findFiles(
            nodePath.join(directory, entry.name).replaceAll("\\", "/"),
          );
        }

        const extension = entry.name.split(".").at(-1);

        if (!JS_EXTENSIONS.has(extension ?? "")) {
          return [];
        }

        const fullPath = nodePath
          .join(this.basePath, directory, entry.name)
          .replaceAll("\\", "/");

        return [escapePathForWindows(fullPath)];
      }),
    );

    return results.flat();
  }
}
