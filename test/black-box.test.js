/* eslint-disable n/no-sync */

import { exec } from "node:child_process";
import fs from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import fetch from "node-fetch";

const SERVER_START_WAIT_SECONDS = 10;

describe("black box test", () => {
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

    await new Promise((resolve) => {
      counterfactProcess.stdout.on("data", resolve);
    });

    // wait a few seconds to make sure the server is up

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
    expect(
      fs.readFileSync("./out/routes/hello/kitty.ts", "utf8"),
    ).toMatchSnapshot();
  });

  it("compiles kitty.ts", () => {
    expect(
      fs.readFileSync("./out/.cache/hello/kitty.cjs", "utf8"),
    ).toMatchSnapshot();
  });

  it("responds to a GET request", async () => {
    const response = await fetch("http://localhost:3100/hello/kitty");

    await expect(response.text()).resolves.toMatchSnapshot();
    expect(response.status).toBe(200);
  });
});
