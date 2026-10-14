import { describe, expect, it } from "@jest/globals";
import ts from "typescript";

import { Repository } from "../src/repository.js";
import { Requirement } from "../src/requirement.js";
import { SchemaTypeCoder } from "../src/schema-type-coder.js";

function diagnostics(source: string): string[] {
  const options: ts.CompilerOptions = {
    strict: true,
    noLib: true,
    noEmit: true,
  };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) =>
    name === "generated.ts"
      ? ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true)
      : undefined;
  const program = ts.createProgram(["generated.ts"], options, host);

  return [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ].map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  );
}

async function generateType(schema: Record<string, unknown>): Promise<string> {
  const script = new Repository().get("types/example.ts");
  script.exportType(new SchemaTypeCoder(new Requirement(schema, "#/Example")));
  return script.contents();
}

describe("AST schema generation", () => {
  it("preserves literal property names and enum values through final printing", async () => {
    const name = 'quote" slash\\ newline\n';
    const value = 'value" slash\\ newline\n';
    const source = await generateType({
      type: "object",
      required: [name],
      properties: { [name]: { type: "string", enum: [value] } },
    });
    const parsed = ts.createSourceFile(
      "generated.ts",
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const alias = parsed.statements[0] as ts.TypeAliasDeclaration;
    const member = (alias.type as ts.TypeLiteralNode)
      .members[0] as ts.PropertySignature;

    expect((member.name as ts.StringLiteral).text).toBe(name);
    expect(
      ((member.type as ts.LiteralTypeNode).literal as ts.StringLiteral).text,
    ).toBe(value);
    expect(
      diagnostics(
        `${source}\nconst valid: Example = { [${JSON.stringify(name)}]: ${JSON.stringify(value)} };`,
      ),
    ).toEqual([]);
  });

  it("requires every part of an intersection containing a union", async () => {
    const source = await generateType({
      allOf: [
        {
          anyOf: [
            {
              type: "object",
              properties: { a: { type: "string" } },
              required: ["a"],
            },
            {
              type: "object",
              properties: { b: { type: "number" } },
              required: ["b"],
            },
          ],
        },
        {
          type: "object",
          properties: { c: { type: "boolean" } },
          required: ["c"],
        },
      ],
    });

    expect(
      diagnostics(`${source}
      const first: Example = { a: "ok", c: true };
      const second: Example = { b: 1, c: false };
      // @ts-expect-error Every union branch must also satisfy the intersection.
      const missing: Example = { a: "ok" };
    `),
    ).toEqual([]);
  });

  it("preserves negative, boolean, and null enum literals", async () => {
    const source = await generateType({ enum: [-2, true, null] });
    expect(
      diagnostics(`${source}
      const negative: Example = -2;
      const boolean: Example = true;
      const nullable: Example = null;
      // @ts-expect-error Positive two is not an allowed literal.
      const wrong: Example = 2;
    `),
    ).toEqual([]);
  });
});
