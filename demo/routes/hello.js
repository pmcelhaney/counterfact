export function GET({ path, store }) {
  store.visits ??= {};
  store.visits[path] ??= 0;
  store.visits[path] += 1;

  if (!path) {
    return { body: "Hello, stranger!" };
  }

  return {
    body: `Hello, ${path}!`,
  };
}
