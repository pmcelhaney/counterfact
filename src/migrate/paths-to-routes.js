/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { promises as fs } from "node:fs";
import path from "node:path";

// eslint-disable-next-line max-statements
async function copyAndModifyFiles(sourceDirectory, destinationDirectory) {
  try {
    const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

    await fs.mkdir(destinationDirectory, { recursive: true });

    for (const entry of entries) {
      const sourcePath = path.join(sourceDirectory, entry.name);
      const destinationPath = path.join(destinationDirectory, entry.name);

      if (entry.isDirectory()) {
        await copyAndModifyFiles(sourcePath, destinationPath);
      } else {
        let fileContent = await fs.readFile(sourcePath, "utf8");

        fileContent = fileContent.replaceAll("path-types", "types/paths");
        await fs.writeFile(destinationPath, fileContent);
      }
    }
  } catch (error) {
    console.error("Error copying and modifying files:", error);
  }
}

export async function pathsToRoutes(rootDirectory) {
  await copyAndModifyFiles(
    path.join(rootDirectory, "paths"),
    path.join(rootDirectory, "routes"),
  );
}
