import { TypeCoder } from "./type-coder.js";

// Helper class for exporting parameter types
export class ParameterExportTypeCoder extends TypeCoder {
  constructor(requirement, typeName, typeCode, parameterKind) {
    super(requirement);
    this._typeName = typeName;
    this._typeCode = typeCode;
    this._parameterKind = parameterKind;
  }

  get id() {
    // Make the id unique by including the parameter kind
    return `${super.id}:${this._parameterKind}`;
  }

  *names() {
    yield this._typeName;
  }

  writeCode() {
    return this._typeCode;
  }

  modulePath() {
    // Use the same module path as the parent operation
    return this._modulePath;
  }
}
