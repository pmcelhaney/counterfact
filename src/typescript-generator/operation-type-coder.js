import { Coder } from "./coder.js";

export class OperationTypeCoder extends Coder {
  name() {
    return `HTTP_${this.requirement.url.split("/").at(-1).toUpperCase()}`;
  }

  write() {
    return "() => { body: any, contentType: string, statusCode: number }";
  }
}
