import { landingPageBody } from "../../src/server/start.js";

describe("start", () => {
  it("renders the landing page", () => {
    const basePath = "/home/user/counterfact";
    const result = landingPageBody(basePath);

    expect(result).toContain(basePath);
  });
});
