import { landingPageTemplate } from "../../src/server/start.js";

describe("start", () => {
  it("renders the landing page", async () => {
    const result = await landingPageTemplate({ routes: ["/hello/world"] });

    expect(result).toContain("/hello/world");
  });
});
