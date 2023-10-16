import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

function processFile(filePath) {
  const content = readFileSync(filePath, "utf8");

  if (
    content.includes("export type ContextType =") ||
    content.includes("export type { ContextType }")
  ) {
    return;
  }

  if (content.includes("export default new Context")) {
    writeFileSync(filePath, "export type ContextType = Context;\n", {
      flag: "a",
    });
  } else {
    writeFileSync(
      filePath,
      'export type { ContextType } from "../$.context";\n',
    );
  }
}

function migrateContextFiles(path) {
  if (!existsSync(path)) {
    return;
  }

  const items = readdirSync(path);

  for (const item of items) {
    const itemPath = join(path, item);
    const stats = statSync(itemPath);

    if (stats.isDirectory()) {
      migrateContextFiles(itemPath);
    }

    if (stats.isFile() && item === "$.context.ts") {
      processFile(itemPath);
    }
  }
}

export function migrate(rootPath) {
  if (!existsSync(rootPath)) {
    return;
  }

  migrateContextFiles(join(rootPath, "paths"));
}
