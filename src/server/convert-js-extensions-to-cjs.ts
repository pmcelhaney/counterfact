export function convertFileExtensionsToCjs(code: string) {
  // Match require('...') or require("...") where the path starts with .
  // Replace .js or .ts extensions (or no extension) with .cjs
  return code.replace(
    /require\((['"])(\.[^'"]*?)(\.(?:js|ts))?\1\)/g,
    (match, quote, path) => `require(${quote}${path}.cjs${quote})`,
  );
}
