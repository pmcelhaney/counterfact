declare const __brand: unique symbol;

export type NormalizedPath = string & { [__brand]: "NormalizedPath" };

export function normalizePath(path: string): NormalizedPath {
  return path.replaceAll("\\", "/") as NormalizedPath;
}
