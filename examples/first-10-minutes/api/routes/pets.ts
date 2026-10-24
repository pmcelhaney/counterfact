export function POST($) {
  return $.response[201].json($.context.add($.body));
}
