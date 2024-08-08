interface XmlHints {
  attribute?: boolean;
  name?: string;
  namespace?: string;
  prefix?: string;
  wrapped?: boolean;
}

interface Schema {
  [key: string]: unknown;
  items?: Schema;
  properties?: {
    [key: string]: Schema;
  };
  xml?: XmlHints;
}

function xmlEscape(xmlString: string): string {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  return xmlString.replace(/["&'<>]/gv, (character: string) => {
    switch (character) {
      case "<": {
        return "&lt;";
      }
      case ">": {
        return "&gt;";
      }
      case "&": {
        return "&amp;";
      }
      case "'": {
        return "&apos;";
      }
      case '"': {
        return "&quot;";
      }

      default: {
        return character;
      }
    }
  });
}

function objectToXml(
  json: object,
  schema: Schema | undefined,
  name: string,
): string {
  const xml: string[] = [];

  const attributes: string[] = [];

  Object.entries(json).forEach(([key, value]) => {
    const properties = schema?.properties?.[key];

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (properties?.attribute) {
      attributes.push(` ${key}="${xmlEscape(String(value))}"`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      xml.push(jsonToXml(value, properties, key));
    }
  });

  return `<${name}${attributes.join("")}>${String(xml.join(""))}</${name}>`;
}

export function jsonToXml(
  json: unknown,
  schema: Schema | undefined,
  keyName = "root",
): string {
  const name = schema?.xml?.name ?? keyName;

  if (Array.isArray(json)) {
    const items = json
      .map((item) => jsonToXml(item, schema?.items, name))
      .join("");

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (schema?.xml?.wrapped) {
      return `<${name}>${items}</${name}>`;
    }

    return items;
  }

  if (typeof json === "object" && json !== null) {
    return objectToXml(json, schema, name);
  }

  return `<${name}>${String(json)}</${name}>`;
}
