import { landingPageTemplate } from "../../src/server/start.js";

describe("start", () => {
  it("renders the landing page", async () => {
    const basePath = "/home/user/counterfact";
    const result = await landingPageTemplate({ basePath });

    expect(result).toContain(basePath);
  });
});
