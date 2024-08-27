import { pathToFileURL } from "node:url";

export async function uncachedImport(pathName: string) {
  const fileUrl = `${pathToFileURL(
    pathName,
  ).toString()}?cacheBust=${Date.now()}`;

  return await import(fileUrl);
}
