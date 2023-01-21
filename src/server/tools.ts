import JSONSchemaFaker from "json-schema-faker";

JSONSchemaFaker.option("useExamplesValue", true);

export class Tools {
  public constructor({ headers = {} } = {}) {
    this.headers = headers;
  }

  public oneOf(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  public accepts(contentType) {
    const acceptHeader = this.headers.Accept;

    if (!acceptHeader) {
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

  public randomFromSchema(schema) {
    return JSONSchemaFaker.generate(schema);
  }
}
