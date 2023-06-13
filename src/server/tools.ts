import { JSONSchemaFaker, type Schema } from "json-schema-faker";

JSONSchemaFaker.option("useExamplesValue", true);

export class Tools {
  private readonly headers: { [key: string]: string };

  public constructor({
    headers = {},
  }: { headers?: { [key: string]: string } } = {}) {
    this.headers = headers;
  }

  public oneOf<Item>(array: Item[]): Item {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return array[Math.floor(Math.random() * array.length)] as Item;
  }

  public accepts(contentType: string): boolean {
    const acceptHeader = this.headers.Accept;

    if (acceptHeader === "" || acceptHeader === undefined) {
      return true;
    }

    const acceptTypes = acceptHeader.split(",");

    return acceptTypes.some((acceptType) => {
      const [type, subtype] = acceptType.split("/");

      return (
        (type === "*" || type === contentType.split("/")[0]) &&
        (subtype === "*" || subtype === contentType.split("/")[1])
      );
    });
  }

  public randomFromSchema(schema: Schema): unknown {
    return JSONSchemaFaker.generate(schema);
  }
}
