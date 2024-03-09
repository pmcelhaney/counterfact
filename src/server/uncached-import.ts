import { pathToFileURL } from "node:url";

export async function uncachedImport(pathName: string) {
  const fileUrl = `${pathToFileURL(
    pathName,
  ).toString()}?cacheBust=${Date.now()}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, import/no-dynamic-require, no-unsanitized/method
  return await import(fileUrl);
}
