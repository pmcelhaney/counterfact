/* eslint-disable n/no-sync */
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_MODULE_KIND = "commonjs";

interface PackageJsonWithType {
  type?: string;
}

export async function determineModuleKind(modulePath: string) {
  if (modulePath.endsWith(".cjs")) {
    return "commonjs";
  }

  if (modulePath.endsWith(".mjs") || modulePath.endsWith(".ts")) {
    return "module";
  }

  if (modulePath === path.parse(modulePath).root) {
    return DEFAULT_MODULE_KIND;
  }

  const packageJsonPath = path.join(modulePath, "package.json");

  if (existsSync(packageJsonPath)) {
    try {
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

  return await determineModuleKind(path.dirname(modulePath));
}
