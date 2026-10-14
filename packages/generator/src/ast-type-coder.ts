import type ts from "typescript";

import { printNode, typeReference } from "./ast.js";
import { TypeCoder } from "./type-coder.js";
import type { Script } from "./script.js";

/** Type emitters use nodes internally; write() bridges remaining text coders. */
export abstract class AstTypeCoder extends TypeCoder {
  public writeNode(script: Script): ts.TypeNode {
    if (this.requirement?.isReference) {
      return typeReference(script.importType(this));
    }

    return this.buildTypeNode(script);
  }

  public override writeCode(script: Script): string {
    return printNode(this.buildTypeNode(script));
  }

  public abstract buildTypeNode(script: Script): ts.TypeNode;
}
