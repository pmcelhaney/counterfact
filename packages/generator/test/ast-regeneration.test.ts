import { describe, expect, it } from "@jest/globals";
import ts from "typescript";
import { usingTemporaryFiles } from "using-temporary-files";

import { CodeGenerator } from "../src/code-generator.js";
import { ScenarioFileGenerator } from "../src/scenario-file-generator.js";

const specification = {
  openapi: "3.0.3",
  info: { title: "Regeneration", version: "1" },
  paths: {
    "/thing": {
      get: {
        operationId: "getThing",
        responses: { 204: { description: "Empty" } },
      },
      post: {
        operationId: "createThing",
        responses: { 204: { description: "Empty" } },
      },
    },
  },
};

describe("AST route regeneration", () => {
  it("recognizes handlers supplied by a star re-export without executing them", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("openapi.json", JSON.stringify(specification));
      await $.add(
        "routes/shared.ts",
        'throw new Error("must not execute"); export function GET() { return {}; }',
      );
      const original = 'export * from "./shared.js";\n';
      await $.add("routes/thing.ts", original);
      await new CodeGenerator($.path("openapi.json"), $.path(""), {
        routes: true,
        types: true,
      }).generate();
      const content = await $.read("routes/thing.ts");
      expect(content).toContain(original);
      expect(content).not.toContain("export const GET");
      expect(content).toContain("export const POST");
    });
  });
  it.each([
    'export function GET() { return { nested: { text: "};" } }; }\n',
    'const original = () => ({ nested: { text: "};" } });\nexport { original as GET };\n',
  ])(
    "preserves an existing function or aliased export and adds POST",
    async (original) => {
      await usingTemporaryFiles(async ($) => {
        await $.add("openapi.json", JSON.stringify(specification));
        await $.add("routes/thing.ts", original);
        const generator = new CodeGenerator(
          $.path("openapi.json"),
          $.path(""),
          { routes: true, types: true },
        );
        await generator.generate();
        const content = await $.read("routes/thing.ts");
        expect(content).toContain(original);
        expect(content).not.toContain("export const GET");
        expect(content).toContain("export const POST");
        await generator.generate();
        expect(await $.read("routes/thing.ts")).toBe(content);
      });
    },
  );

  it("inserts after complete multiline imports and comments, and aliases a conflicting type", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("openapi.json", JSON.stringify(specification));
      await $.add("routes/other.ts", "export type createThing = string;");
      const original =
        'import type {\n  createThing,\n} from "./other.js"; /* first line\nsecond line */\n' +
        'export function GET() { return { nested: { text: "};" } }; }\n';
      await $.add("routes/thing.ts", original);
      const generator = new CodeGenerator($.path("openapi.json"), $.path(""), {
        routes: true,
        types: true,
      });
      await generator.generate();
      const content = await $.read("routes/thing.ts");
      expect(content).toContain(
        "second line */\nimport type { createThing as createThing2 }",
      );
      expect(content).toContain("export const POST: createThing2");
      expect(content).toContain(
        'export function GET() { return { nested: { text: "};" } }; }',
      );
      await new ScenarioFileGenerator($.path("")).generate();
      const program = ts.createProgram([$.path("routes/thing.ts")], {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowImportingTsExtensions: true,
      });
      expect(
        ts
          .getPreEmitDiagnostics(program)
          .map((diagnostic) =>
            ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
          ),
      ).toEqual([]);
      await generator.generate();
      expect(await $.read("routes/thing.ts")).toBe(content);
    });
  });

  it("keeps a leading reference directive ahead of inserted imports", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("openapi.json", JSON.stringify(specification));
      await $.add("routes/reference.d.ts", "interface Marker {}");
      const directive = '/// <reference path="./reference.d.ts" />\n';
      const original = directive + "export function GET() { return {}; }\n";
      await $.add("routes/thing.ts", original);
      await new CodeGenerator($.path("openapi.json"), $.path(""), {
        routes: true,
        types: true,
      }).generate();
      const content = await $.read("routes/thing.ts");
      expect(content.startsWith(directive + "import type")).toBe(true);
      expect(content).toContain("export function GET() { return {}; }");
    });
  });
});
