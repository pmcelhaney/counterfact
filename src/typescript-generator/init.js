import nodePath from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";
import fs from "fs-extra";

const rootPath = nodePath.join(
  nodePath.dirname(fileURLToPath(import.meta.url)),
  "../../"
);

export async function init(source, destination) {
  // eslint-disable-next-line node/no-sync
  if (fs.existsSync(destination)) {
    throw new Error(`Destination already exists: ${destination}`);
  }

  await fs.copy(nodePath.join(rootPath, "templates/typescript"), destination);

  const specification = await yaml.load(await fs.readFile(source, "utf8"));

  specification.servers.unshift({ url: "/" });

  try {
    await fs.writeFile(
      nodePath.join(destination, "counterfact", "public", "openapi.yaml"),
      yaml.dump(specification)
    );
  } catch {
    throw new Error("Could not write openapi.yaml");
  }
}
