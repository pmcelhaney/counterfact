import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_MODULE_KIND = "commonjs";

interface PackageJsonWithType {
  type?: string;
}
// eslint-disable-next-line max-statements
export async function determineModuleKind(directory: string) {
  const packageJsonPath = path.join(directory, "package.json");

  if (directory === path.parse(directory).root) {
    return DEFAULT_MODULE_KIND;
  }

  if (existsSync(packageJsonPath)) {
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const packageJson: PackageJsonWithType = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8"),
      ) as PackageJsonWithType;

      if (typeof packageJson.type !== "string") {
        return DEFAULT_MODULE_KIND;
      }

      return packageJson.type;
    } catch (error) {
      process.stderr.write(
        `Error reading or parsing package.json: ${String(error)}`,
      );
    }
  }

  return await determineModuleKind(path.dirname(directory));
}
