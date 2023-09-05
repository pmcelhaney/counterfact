/* eslint-disable jest/no-hooks */
import { exec } from "node:child_process";

// eslint-disable-next-line @typescript-eslint/no-shadow, no-shadow
import fetch from "node-fetch";

describe("black box test", () => {
  // eslint-disable-next-line init-declarations
  let counterfactProcess;

  beforeAll(async () => {
    // eslint-disable-next-line sonar/no-os-command-from-path
    counterfactProcess = exec("npx . ./openapi-example.yaml out");

    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      counterfactProcess.stdout.on("data", resolve);
    });

    // wait a few seconds to make sure the server is up
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }, 60_000);

  afterAll(() => {
    counterfactProcess.stdout.destroy();
    counterfactProcess.stderr.destroy();
    counterfactProcess.stdin.destroy();
    counterfactProcess.kill();
    counterfactProcess.unref();
  });

  it("responds to a GET request", async () => {
    const response = await fetch("http://localhost:3100/hello/world");

    expect(response.status).toBe(200);
  });
});
