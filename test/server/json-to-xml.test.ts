function objectToXml(
  json: { [key: string]: unknown },
  schema: unknown,
  name: string,
): string {
  const xml: string[] = [];
  Object.entries(json).forEach(([key, value]) => {
    xml.push(jsonToXml(value, schema?.properties?.[key], key));
  });

  return String(xml.join(""));
}

function jsonToXml(
  json: unknown,
  schema: { [key: string]: unknown },
  keyName: string,
): string {
  const name = schema.xml?.name ?? keyName;
  if (typeof json === "object") {
    return `<${name}>${objectToXml(json, schema, name)}</${name}>`;
  }

  return `<${name}>${json}</${name}>`;
}

describe("JSON to XML", () => {
  it("converts a JSON object to XML", () => {
    const json = { author: "string", id: 0, title: "string" };

    const schema = {
      properties: {
        author: {
          type: "string",
        },

        id: {
          type: "number",
        },

        title: {
          type: "string",
        },
      },
    };
    const xml = jsonToXml(json, schema, "book");

    expect(xml).toBe(
      "<book><author>string</author><id>0</id><title>string</title></book>",
    );
  });

  it("uses the xml name from the schema", () => {
    const json = { author: "string", id: 0, title: "string" };

    const schema = {
      properties: {
        author: {
          type: "string",
        },

        id: {
          type: "number",
        },

        title: {
          type: "string",
        },
      },

      xml: {
        name: "xml-book",
      },
    };
    const xml = jsonToXml(json, schema, "book");

    expect(xml).toBe(
      "<xml-book><author>string</author><id>0</id><title>string</title></xml-book>",
    );
  });
});

export default objectToXml;
