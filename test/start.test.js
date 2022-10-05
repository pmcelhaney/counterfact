import { landingPageBody } from "../src/start.js";

describe("start", () => {
  it("renders the landing page", () => {
    const basePath = "/home/user/counterfact";
    const result = landingPageBody(basePath);

    expect(result).toContain(basePath);
  });
});
