/* eslint-disable jest/no-restricted-matchers */
/* eslint-disable n/no-sync */
/* eslint-disable jest/no-hooks */
import { exec } from "node:child_process";
import fs from "node:fs";

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

  it("launches the 'home page'", async () => {
    const response = await fetch("http://localhost:3100/counterfact/");

    expect(response.status).toBe(200);
  });

  it("creates a file for the /hello/kitty path", () => {
    expect(fs.readFileSync("./out/paths/hello/kitty.ts")).toMatchSnapshot();
  });

  it("compiles kitty.ts", () => {
    expect(fs.readFileSync("./out/paths-js/hello/kitty.mjs")).toMatchSnapshot();
  });

  it("responds to a GET request", async () => {
    const response = await fetch("http://localhost:3100/hello/kitty");

    expect(response.status).toBe(200);
  });
});
