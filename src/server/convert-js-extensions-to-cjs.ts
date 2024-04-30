import { type ASTNode, namedTypes, visit } from "ast-types";
import { parse, print } from "recast";

export function convertFileExtensionsToCjs(code: string) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ast = parse(code) as ASTNode;

  // Visit the nodes in the AST looking for `require` calls
  visit(ast, {
    // Identify the CallExpression nodes
    visitCallExpression(path) {
      const { node } = path;

      // Check if it's a require call
      if (
        namedTypes.CallExpression.check(node) &&
        node.callee.type === "Identifier" &&
        node.callee.name === "require" &&
        node.arguments[0] !== undefined &&
        node.arguments[0].type === "Literal" &&
        typeof node.arguments[0].value === "string" &&
        node.arguments[0].value.startsWith(".")
      ) {
        // Change the module string from "foo.js" to "foo.cjs"
        node.arguments[0].value = "foo.cjs";
      }

      // Continue traversing the AST
      this.traverse(path);
    },
  });
  return print(ast).code;
}
