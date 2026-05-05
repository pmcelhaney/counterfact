import { defineConfig } from "astro/config";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin that strips .md extensions from local href attributes so that
 * cross-document links written as `[text](./other.md)` (valid on GitHub) are
 * transformed to `./other` when rendered to HTML on the site.
 */
function rehypeStripMdLinks() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (
        node.tagName === "a" &&
        typeof node.properties?.href === "string" &&
        !node.properties.href.includes("://") &&
        !node.properties.href.startsWith("mailto:") &&
        !node.properties.href.startsWith("tel:")
      ) {
        node.properties.href = node.properties.href.replace(
          /\.md(\?[^#]*)?(#.*)?$/,
          (_, query, anchor) => `${query ?? ""}${anchor ?? ""}`,
        );
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://counterfact.dev",
  output: "static",
  markdown: {
    rehypePlugins: [rehypeStripMdLinks],
  },
});
