import type { HTTP_GET } from "./{name}.types";

export const GET: HTTP_GET = ({ path, context, query }) => {
  context.visits ??= {};
  context.visits[path.name] ??= 0;
  context.visits[path.name] += 1;

  return {
    body: `${query.greeting ?? "Hello"}, ${path.name}!`,
  };
};
