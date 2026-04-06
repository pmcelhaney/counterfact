import { describe, expect, it } from "@jest/globals";

import { Tools } from "../../src/server/tools.ts";

describe("tools", () => {
  it("oneOf()", () => {
    const tools = new Tools();

    expect(["A", "B", "C"]).toContain(tools.oneOf(["A", "B", "C"]));
  });

  it.each`
    contentType           | acceptHeader
    ${"what/ever"}        | ${undefined}
    ${"text/html"}        | ${"text/html"}
    ${"text/html"}        | ${"text/*"}
    ${"application/json"} | ${"*/json"}
    ${"text/*"}           | ${"text/*"}
  `(
    "accept('$contentType') returns true when the accept header is $acceptHeader",
    ({ acceptHeader, contentType }) => {
      const tools = new Tools({ headers: { Accept: acceptHeader } });

      expect(tools.accepts(contentType)).toBe(true);
    },
  );

  it.each`
    contentType           | acceptHeader
    ${"application/json"} | ${"text/*"}
    ${"text/html"}        | ${"text/plain"}
    ${"application/json"} | ${"text/json"}
  `(
    "accept('$contentType') returns false when the accept header is $acceptHeader",
    ({ acceptHeader, contentType }) => {
      const tools = new Tools({ headers: { Accept: acceptHeader } });

      expect(tools.accepts(contentType)).toBe(false);
    },
  );

  // BUG: accepts() uses this.headers.Accept (capital A) but Node.js HTTP headers
  // are normalized to lowercase. When headers come from a real HTTP request via Koa,
  // the accept header is 'accept' (lowercase), so this.headers.Accept is always
  // undefined, causing accepts() to always return true.
  it("accepts('application/json') returns false when lowercase 'accept' header is 'text/plain'", () => {
    const tools = new Tools({ headers: { accept: "text/plain" } });

    expect(tools.accepts("application/json")).toBe(false);
  });

  // BUG: accepts() splits the Accept header by "," but does not trim whitespace
  // from each part. When the Accept header contains spaces after commas
  // (e.g., "text/html, application/json"), the split produces " application/json"
  // (with a leading space), causing the type comparison to fail.
  it("accepts('application/json') returns true when Accept header is 'text/html, application/json' (with space)", () => {
    const tools = new Tools({
      headers: { Accept: "text/html, application/json" },
    });

    expect(tools.accepts("application/json")).toBe(true);
  });

  it("randomFromSchema() returns a value (the implementation is in a third party library)", async () => {
    const tools = new Tools();

    expect(typeof (await tools.randomFromSchema({ type: "integer" }))).toBe(
      "number",
    );
  });

  it("randomFromSchema() uses examples", async () => {
    const tools = new Tools();

    expect(
      await tools.randomFromSchema({ examples: [5], type: "integer" }),
    ).toBe(5);
  });
});
