import { Statement } from "../../src/typescript-generator/statement.js";

describe("a Statement", () => {
  it("prints the object at its URL with its printer", async () => {
    const spec = {
      components: {
        schemas: {
          Person: {
            type: "object",

            properties: {
              name: {
                type: "string",
              },

              age: {
                type: "number",
              },
            },
          },
        },
      },
    };

    const source = {
      load() {
        return spec;
      },
    };

    const statement = new Statement(
      source,
      "#/components/schemas/Person",
      (object) => JSON.stringify(object)
    );

    await expect(statement.print()).resolves.toBe(
      '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"number"}}}'
    );
  });
});
