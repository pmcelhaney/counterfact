import type { HTTP_GET } from "./count.types";

export const GET: HTTP_GET = ({ context }) => {
  if (Object.keys(context.visits).length === 0) {
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
