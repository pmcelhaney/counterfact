export function GET({ path, store, query }) {
  store.visits ??= {};
  store.visits[path.name] ??= 0;
  store.visits[path.name] += 1;

  if (!path) {
    return { body: "Hello, stranger!" };
  }

  return {
    body: `${query.greeting ?? "Hello"}, ${path.name}!`,
  };
}
