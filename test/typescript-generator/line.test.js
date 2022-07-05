import { Line } from "../../src/typescript-generator/line.js";

describe("a Line", () => {
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

    const line = new Line(source, "components/schemas/Person", (object) =>
      JSON.stringify(object)
    );

    await expect(line.print(spec)).resolves.toBe(
      '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"number"}}}'
    );
  });
});
