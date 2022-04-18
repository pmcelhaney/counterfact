export function GET({ store }) {
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
}
