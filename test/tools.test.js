import { Tools } from "../src/tools.js";

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
    ({ contentType, acceptHeader }) => {
      const tools = new Tools({ headers: { Accept: acceptHeader } });

      expect(tools.accepts(contentType)).toBe(true);
    }
  );

  it.each`
    contentType           | acceptHeader
    ${"application/json"} | ${"text/*"}
    ${"text/html"}        | ${"text/plain"}
    ${"application/json"} | ${"text/json"}
  `(
    "accept('$contentType') returns false when the accept header is $acceptHeader",
    ({ contentType, acceptHeader }) => {
      const tools = new Tools({ headers: { Accept: acceptHeader } });

      expect(tools.accepts(contentType)).toBe(false);
    }
  );
});
