/* eslint-disable sonar/no-os-command-from-path */
/* eslint-disable sonar/os-command */
/* eslint-disable no-console */
/* eslint-disable n/no-process-env */
/* eslint-disable jest/no-restricted-matchers */
/* eslint-disable n/no-sync */
/* eslint-disable jest/no-hooks */
import { exec } from "node:child_process";
import fs from "node:fs";

// eslint-disable-next-line @typescript-eslint/no-shadow, no-shadow
import fetch from "node-fetch";

const SERVER_START_WAIT_SECONDS = 10;

describe("black box test", () => {
  // eslint-disable-next-line init-declarations
  let counterfactProcess;

  beforeAll(async () => {
    counterfactProcess = exec(
      "node ./bin/counterfact.js ./openapi-example.yaml out",
      {
        env: { ...process.env, DEBUG: "counterfact:*" },
      },
    );

    counterfactProcess.stderr.pipe(process.stderr);
    counterfactProcess.stdout.pipe(process.stdout);

    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      counterfactProcess.stdout.on("data", resolve);
    });

    // wait a few seconds to make sure the server is up
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      console.log(
        `waiting ${SERVER_START_WAIT_SECONDS} seconds for server to start`,
      );
      setTimeout(resolve, SERVER_START_WAIT_SECONDS * 1000);
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
    await expect(response.text()).resolves.toMatchSnapshot();
  });
});
