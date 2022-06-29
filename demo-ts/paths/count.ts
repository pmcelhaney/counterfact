import type { HTTP_GET } from "./count.types";

export const GET: HTTP_GET = ({ context }) => {
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
