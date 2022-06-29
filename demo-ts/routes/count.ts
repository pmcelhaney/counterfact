import type { Get_count } from "./#types";

export const GET: Get_count = ({ context }) => {
  if (context.visits === undefined) {
    return {
      body: "You have not visited anyone yet.",
    };
  }

  return {
    body: Object.entries(context.visits)
      .map(
        ([page, count]: [string, number]) =>
          `You visited ${page} ${count} times.`
      )
      .join("\n"),
  };
};
