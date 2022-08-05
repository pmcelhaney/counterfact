export function GET({ path, context, query, response }) {
  context.visits ??= {};
  context.visits[path.name] ??= 0;
  context.visits[path.name] += 1;

  return response["200"].text(`${query.greeting ?? "Hello"}, ${path.name}!`);
}
