import { Repository } from "../../src/typescript-generator/repository.js";
import { Specification } from "../../src/typescript-generator/specification.js";
import { Coder } from "../../src/typescript-generator/coder.js";

describe("integration Test", () => {
  it("writes some code", async () => {
    const specification = new Specification();

    specification.cache.set("openapi.yaml", {
      paths: {
        "/accounts": {},
        "/accounts/{id}": {},
      },
    });

    const repository = new Repository();
    const index = repository.get("index.ts");
    const start = await specification.requirementAt("openapi.yaml#/paths");

    class PathCoder extends Coder {
      write(script) {
        Object.keys(this.requirement.data).forEach((key) => {
          script.import(this, `paths/${key}.ts`); // <-- need to use the second argument here and get rid of scriptPath()
        });

        return "/* some code */";
      }

      get scriptPath() {
        return "paths.ts";
      }
    }

    const coder = new PathCoder(start);

    index.export(coder);

    await index.finished();

    expect(index.contents()).toBe(
      'import paths from "./paths.ts";\n\nexport const paths = /* some code */;\n'
    );
  });
});
