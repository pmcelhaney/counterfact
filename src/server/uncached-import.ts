import { pathToFileURL } from "node:url";

// eslint-disable-next-line etc/no-misused-generics
export async function uncachedImport<ModuleType>(pathName: string) {
  const fileUrl = `${pathToFileURL(
    pathName,
  ).toString()}?cacheBust=${Date.now()}`;

  process.stdout.write(fileUrl);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, import/no-dynamic-require, no-unsanitized/method
  const aModule = await import(fileUrl);

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return aModule as ModuleType;
}
