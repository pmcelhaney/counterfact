export function printObjectWithoutQuotes(entries) {
  return `{\n${entries
    .map(([key, value]) => `${key}: ${value}`)
    .join(",\n")}\n}`;
}

export function printObject(entries) {
  return `{\n${entries
    .map(([key, value]) => `"${key}": ${value}`)
    .join(",\n")}\n}`;
}
