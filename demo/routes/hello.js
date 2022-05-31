export function GET({ path, store, query }) {
  store.visits ??= {};
  store.visits[path] ??= 0;
  store.visits[path] += 1;

  if (!path) {
    return { body: "Hello, stranger!" };
  }

  return {
    body: `${query.greeting ?? "Hello"}, ${path}!`,
  };
}
