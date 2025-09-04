const UNICODE_RATIO_SYMBOL = "∶"; // U+2236
const REGULAR_COLON = ":";

export function escapePathForWindows(path) {
  return path.replace(
    /^([A-Za-z]):(.*)/,
    (_, drive, rest) =>
      `${drive}:${rest.replaceAll(REGULAR_COLON, UNICODE_RATIO_SYMBOL)}`,
  );
}

export function unescapePathForWindows(path) {
  return path.replaceAll(UNICODE_RATIO_SYMBOL, REGULAR_COLON);
}
