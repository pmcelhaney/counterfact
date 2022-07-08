import { withTemporaryFiles } from "../lib/with-temporary-files.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";

describe("a Specification", () => {
  it("loads a file from disk", async () => {
    await withTemporaryFiles(
      { "openapi.yaml": "hello:\n  world" },
      async (temporaryDirectory) => {
        const specification = new Specification(temporaryDirectory);

        await specification.loadFile("openapi.yaml");

        expect(specification.cache.get("openapi.yaml")).toStrictEqual({
          hello: "world",
        });
      }
    );
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
});
