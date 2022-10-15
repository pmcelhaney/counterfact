export function printObjectFromEntries(entries) {
  return `{\n${entries
    .map(([key, value]) => `"${key}": ${value}`)
    .join(",\n")}\n}`;
}
