declare const __forwardSlashPath: unique symbol;

/**
 * A string that is guaranteed to use forward slashes as path separators,
 * with no backslashes.  This is required for URL-style paths and cross-platform
 * module identifiers.
 *
 * Obtain values of this type via {@link toForwardSlashPath}.
 */
export type ForwardSlashPath = string & {
  readonly [__forwardSlashPath]: never;
};

/**
 * Converts a file-system path to use forward slashes as separators.
 *
 * On Windows, `node:path` methods such as `path.join` and `path.resolve`
 * return paths with backslash separators.  Many parts of Counterfact
 * (chokidar watchers, ES module import specifiers, URL routing) require
 * forward slashes.  This function centralises that normalisation and returns
 * a {@link ForwardSlashPath} branded type so that call sites that demand a
 * forward-slash path are statically enforced.
 *
 * @param path - Any file-system path string.
 * @returns The same path with every `\` replaced by `/`.
 */
export function toForwardSlashPath(path: string): ForwardSlashPath {
  return path.replaceAll("\\", "/") as ForwardSlashPath;
}
