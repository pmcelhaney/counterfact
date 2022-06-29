import type { Get_name } from "./#types";

export const GET: Get_name = ({ path, context, query }) => {
  context.visits ??= {};
  context.visits[path.name] ??= 0;
  context.visits[path.name] += 1;

  return {
    body: `${query.greeting ?? "Hello"}, ${path.name}!`,
  };
};
