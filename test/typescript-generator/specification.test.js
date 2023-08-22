import { pathToFileURL } from "node:url";

import Koa from "koa";

import { withTemporaryFiles } from "../lib/with-temporary-files.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";

describe("a Specification", () => {
  it("loads a file from disk", async () => {
    await withTemporaryFiles(
      { "openapi.yaml": "hello:\n  world" },
      async (temporaryDirectory, { path }) => {
        const specification = new Specification();

        await specification.loadFile(path("openapi.yaml"));

        expect(specification.cache.get(path("openapi.yaml"))).toStrictEqual({
          hello: "world",
        });
      }
    );
  });

  it("loads a file from disk with a file URL", async () => {
    await withTemporaryFiles(
      { "openapi.yaml": "hello:\n  world" },
      async (temporaryDirectory, { path }) => {
        const specification = new Specification();

        const url = pathToFileURL(path("openapi.yaml")).href;

        await specification.loadFile(url);

        expect(specification.cache.get(url)).toStrictEqual({
          hello: "world",
        });
      }
    );
  });

  it("loads a file from the web", async () => {
    const app = new Koa();

    app.use(({ response }) => {
      response.body = "hello: world";
    });

    const server = app.listen(0);
    const url = `http://localhost:${server.address().port}/`;

    const specification = new Specification();

    await specification.loadFile(url);

    expect(specification.cache.get(url)).toStrictEqual({
      hello: "world",
    });

    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      server.close(resolve);
    });

    // The server still might not be completely shut down at this point so wait a bit longer
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  });

  it("returns a requirement for a URL", async () => {
    const specification = new Specification();

    specification.cache.set(
      "openapi.yaml",
      Promise.resolve({
        components: {
          schemas: {
            Person: {
              type: "object",

              properties: {
                name: { type: "string" },
                phone: { type: "string" },
              },
            },
          },
        },
      })
    );

    const person = new Requirement(
      {
        type: "object",

        properties: {
          name: { type: "string" },
          phone: { type: "string" },
        },
      },

      "openapi.yaml#/components/schemas/Person",
      specification
    );

    const requirement = await specification.requirementAt(
      "openapi.yaml#/components/schemas/Person"
    );

    expect(requirement).toStrictEqual(person);
  });

  it("looks for requirements in the root document if no path is provided", async () => {
    const specification = new Specification("openapi.yaml");

    specification.cache.set(
      "openapi.yaml",
      Promise.resolve({
        components: {
          schemas: {
            Person: {
              type: "object",

              properties: {
                name: { type: "string" },
                phone: { type: "string" },
              },
            },
          },
        },
      })
    );

    const person = new Requirement(
      {
        type: "object",

        properties: {
          name: { type: "string" },
          phone: { type: "string" },
        },
      },

      "openapi.yaml#/components/schemas/Person",
      specification
    );

    const requirement = await specification.requirementAt(
      "#/components/schemas/Person"
    );

    expect(requirement).toStrictEqual(person);
  });
});
