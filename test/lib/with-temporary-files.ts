import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";

export async function withTemporaryFiles(
  files: Readonly<{ [path: string]: string }>,
  callback: (directory: string) => Promise<void>
): Promise<void> {
  let directory = "";

  try {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "counterfact-"));

    const writes = Object.entries(files).map(async (entry) => {
      const [filename, contents] = entry;
      const filePath = path.join(directory, filename);

      const foo = path.dirname(filePath);

      try {
        await fs.access(foo, fsConstants.W_OK);
      } catch {
        await fs.mkdir(foo, { recursive: true });
      }

      await fs.writeFile(filePath, contents);
    });
    await Promise.all(writes);

    // eslint-disable-next-line node/callback-return
    await callback(directory);
  } finally {
    await fs.rm(directory, {
      recursive: true,
    });
  }
}
