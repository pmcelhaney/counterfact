import ts from "typescript";

import { buildJsDoc } from "./jsdoc.js";

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile(
  "generated.ts",
  "",
  ts.ScriptTarget.Latest,
  false,
  ts.ScriptKind.TS,
);

export function printNode(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

export function typeReference(
  name: string,
  arguments_: readonly ts.TypeNode[] = [],
): ts.TypeReferenceNode {
  return ts.factory.createTypeReferenceNode(name, arguments_);
}

export function unknownType(): ts.TypeNode {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
}

export function neverType(): ts.TypeNode {
  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
}

export function typeLiteral(
  members: readonly ts.TypeElement[],
): ts.TypeLiteralNode {
  const node = ts.factory.createTypeLiteralNode(members);
  // Keep JSDoc on its own line and attached to the following member.
  return members.some(
    (member) => ts.getSyntheticLeadingComments(member)?.length,
  )
    ? node
    : ts.setEmitFlags(node, ts.EmitFlags.SingleLine);
}

export function unionType(types: readonly ts.TypeNode[]): ts.TypeNode {
  return types.length === 0
    ? neverType()
    : ts.factory.createUnionTypeNode(types);
}

export function withJsDoc<T extends ts.Node>(node: T, data: unknown): T {
  const comment = buildJsDoc(data);
  return withComment(node, comment);
}

export function withComment<T extends ts.Node>(node: T, comment: string): T {
  if (comment === "") {
    return node;
  }

  return ts.addSyntheticLeadingComment(
    node,
    ts.SyntaxKind.MultiLineCommentTrivia,
    comment.slice(2, comment.lastIndexOf("*/")),
    true,
  );
}

export function typeProperty(
  name: string,
  type: ts.TypeNode,
  optional = false,
  data?: unknown,
): ts.PropertySignature {
  return withJsDoc(
    ts.factory.createPropertySignature(
      undefined,
      ts.factory.createStringLiteral(name),
      optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      type,
    ),
    data,
  );
}
