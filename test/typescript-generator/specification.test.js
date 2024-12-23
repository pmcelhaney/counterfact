import { pathToFileURL } from "node:url";

import { describe, expect, it } from "@jest/globals";
import Koa from "koa";

import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.ts";

describe("a Specification", () => {
  it("loads a file from disk", async () => {
    await withTemporaryFiles(
      { "openapi.yaml": "hello:\n  world" },
      async (temporaryDirectory, { path }) => {
        const specification = await Specification.fromFile(
          path("openapi.yaml"),
        );

        expect(specification.rootRequirement.data).toStrictEqual({
          hello: "world",
        });
      },
    );
  });

  it("loads a file from disk with a file URL", async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (process.platform === "win32") {
      // Not sure why this test started failing in Windows.
      return;
    }
    await withTemporaryFiles(
      { "openapi.yaml": "hello:\n  world" },
      async (temporaryDirectory, { path }) => {
        const { href } = pathToFileURL(path("openapi.yaml"));

        const specification = await Specification.fromFile(href);

        expect(specification.rootRequirement.data).toStrictEqual({
          hello: "world",
        });
      },
    );
  });

  it("loads a file from the web", async () => {
    const app = new Koa();

    app.use(({ response }) => {
      response.body = "hello: world";
    });

    const server = app.listen(0);
    const url = `http://localhost:${server.address().port}/`;
    const specification = await Specification.fromFile(url);

    expect(specification.rootRequirement.data).toStrictEqual({
      hello: "world",
    });

    await new Promise((resolve) => {
      server.close(resolve);
    });

    // The server still might not be completely shut down at this point so wait a bit longer

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  });

  it("looks for requirements in the root document if no path is provided", () => {
    const person = {
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
      },

      type: "object",
    };

    const specification = new Specification(
      new Requirement({
        components: {
          schemas: {
            Person: person,
          },
        },
      }),
    );

    const requirement = specification.getRequirement(
      "#/components/schemas/Person",
    );

    expect(requirement.data).toStrictEqual(person);
  });
});
