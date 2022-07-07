import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";

describe("a Specification", () => {
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
      specification,
      "openapi.yaml#/components/schemas/Person",
      {
        type: "object",

        properties: {
          name: { type: "string" },
          phone: { type: "string" },
        },
      }
    );

    const requirement = await specification.requirementAt(
      "openapi.yaml#/components/schemas/Person"
    );

    expect(requirement).toStrictEqual(person);
  });
});
