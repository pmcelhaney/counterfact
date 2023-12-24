import { jsonToXml } from "../../src/server/json-to-xml.js";

describe("JSON to XML", () => {
  it("converts a JSON object to XML", () => {
    const json = { author: "string", id: 0, title: "string" };

    const schema = {
      properties: {
        author: {
          type: "string",
        },

        id: {
          attribute: true,
          type: "number",
        },

        title: {
          type: "string",
        },
      },
    };
    const xml = jsonToXml(json, schema, "book");

    expect(xml).toBe(
      '<book id="0"><author>string</author><title>string</title></book>',
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
