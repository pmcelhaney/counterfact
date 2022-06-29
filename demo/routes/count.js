export function GET({ context }) {
  if (!context.visits) {
    return {
      body: "You have not visited anyone yet.",
    };
  }

  return {
    body: Object.entries(context.visits)
      .map(([page, count]) => `You visited ${page} ${count} times.`)
      .join("\n"),
  };
}
