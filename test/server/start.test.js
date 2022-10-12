import { landingPageBody } from "../../src/server/start.js";

describe("start", () => {
  it("renders the landing page", async () => {
    const basePath = "/home/user/counterfact";
    const result = await landingPageBody(basePath);

    expect(result).toContain(basePath);
  });
});
