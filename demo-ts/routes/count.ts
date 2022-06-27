import type { Get_count } from "./#types";

export const GET: Get_count = ({ store }) => {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition
  if (!store.visits) {
    return {
      body: "You have not visited anyone yet.",
    };
  }

  return {
    body: Object.entries(store.visits)
      .map(([page, count]) => `You visited ${page} ${count} times.`)
      .join("\n"),
  };
};
