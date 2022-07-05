import { Generator } from "../../src/typescript-generator/generator.js";

describe("a typescript Generator", () => {
  it("adds an export to a file path", async () => {
    const generator = new Generator();

    generator.addSource("components.yaml", {
      components: {
        schemas: {
          Greeting: {
            type: "string",
          },
        },
      },
    });

    const name = generator.export(
      "greeting.ts",
      "components.yaml#/components/schemas/Greeting",
      (object, name) => `export type ${name} = ${object.type};`
    );

    const line = generator.files.get("greeting.ts").exports.get("Greeting");

    expect(name).toBe("Greeting");

    await expect(line.print()).resolves.toBe("export type Greeting = string;");
  });
});
