import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export async function runtimeCanExecuteErasableTs(): Promise<boolean> {
  const dir = mkdtempSync(join(tmpdir(), "ts-probe-"));

  // helper.ts is imported via .js extension — the TypeScript convention used
  // throughout this codebase. If the runtime resolves helper.js → helper.ts,
  // it is fully capable of running the TypeScript source tree.
  writeFileSync(
    join(dir, "helper.ts"),
    'export const value: string = "ok";\n',
    "utf8",
  );
  writeFileSync(
    join(dir, "main.ts"),
    'import { value } from "./helper.js"; export default value;\n',
    "utf8",
  );

  try {
    const mod = await import(pathToFileURL(join(dir, "main.ts")).href);
    return mod?.default === "ok";
  } catch {
    return false;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

