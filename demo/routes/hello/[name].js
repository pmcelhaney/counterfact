export function GET({ path, context, query }) {
  context.visits ??= {};
  context.visits[path.name] ??= 0;
  context.visits[path.name] += 1;

  if (!path) {
    return { body: "Hello, stranger!" };
  }

  return {
    body: `${query.greeting ?? "Hello"}, ${path.name}!`,
  };
}
