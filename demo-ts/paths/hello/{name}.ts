import type { HTTP_GET } from "./{name}.types";

export const GET: HTTP_GET = ({ path, context, query }) => {
  context.visit(path.name);
  return {
    body: `${query.greeting ?? "Hello"}, ${path.name}!`,
  };
};
