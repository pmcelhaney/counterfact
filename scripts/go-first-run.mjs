import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = await mkdtemp(join(tmpdir(), "counterfact-first-run-"));
const cli = fileURLToPath(
  new URL("../packages/counterfact/bin/counterfact.js", import.meta.url),
);

console.log(`First-run workspace: ${directory}`);
console.log("This directory and any tutorial files are kept after you quit.\n");

const child = spawn(process.execPath, [cli], {
  cwd: directory,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
