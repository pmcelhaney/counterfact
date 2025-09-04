const UNICODE_RATIO_SYMBOL = "∶"; // U+2236
const REGULAR_COLON = ":";

export function escapePathForWindows(path) {
  if (path.at(1) === ":") {
    return (
      path.slice(0, 2) +
      path.slice(2).replaceAll(REGULAR_COLON, UNICODE_RATIO_SYMBOL)
    );
  }
  return path.replaceAll(REGULAR_COLON, UNICODE_RATIO_SYMBOL);
}

export function unescapePathForWindows(path) {
  return path.replaceAll(UNICODE_RATIO_SYMBOL, REGULAR_COLON);
}
