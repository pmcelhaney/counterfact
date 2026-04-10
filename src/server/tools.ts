import { generate, type JsonSchema } from "json-schema-faker";

export class Tools {
  private readonly headers: { [key: string]: string[] | string | undefined };

  public constructor({
    headers = {},
  }: { headers?: { [key: string]: string[] | string | undefined } } = {}) {
    this.headers = headers;
  }

  public oneOf<Item>(array: Item[]): Item {
    return array[Math.floor(Math.random() * array.length)] as Item;
  }

  public accepts(contentType: string): boolean {
    const acceptHeader = Object.entries(this.headers).find(
      ([key]) => key.toLowerCase() === "accept",
    )?.[1];

    if (acceptHeader === "" || acceptHeader === undefined) {
      return true;
    }

    const acceptTypes = String(acceptHeader).split(",");

    return acceptTypes.some((acceptType) => {
      const [type, subtype] = acceptType.trim().split("/");

      return (
        (type === "*" || type === contentType.split("/")[0]) &&
        (subtype === "*" || subtype === contentType.split("/")[1])
      );
    });
  }

  public randomFromSchema(schema: JsonSchema): Promise<unknown> {
    return generate(schema, { useExamplesValue: true, fillProperties: false });
  }
}
