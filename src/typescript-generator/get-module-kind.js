import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export async function getModuleKind(directory) {
  const packageJsonPath = path.join(directory, "package.json");

  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8"),
      );

      return packageJson.type || "commonjs"; // Default to 'commonjs' if type is not defined
    } catch (error) {
      console.error("Error reading or parsing package.json:", error);

      return "commonjs";
    }
  } else {
    console.log("No package.json found in the given directory.");

    return "commonjs";
  }
}
