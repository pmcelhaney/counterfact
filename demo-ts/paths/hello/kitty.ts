import type { HTTP_GET } from "./../../path-types/hello/kitty.types.js";
export const GET: HTTP_GET = ({ context, tools }) => {
  const statusCode = tools.oneOf(["default"]);

  if (tools.accepts("application/json")) {
    const example = tools.oneOf(["hello kitty"]);

    if (example === "hello kitty") {
      return {
        contentType: "application/json",
        body: '<img src="https://upload.wikimedia.org/wikipedia/en/0/05/Hello_kitty_character_portrait.png">',
      };
    }

    return {
      contentType: "application/json",
      body: tools.randomFromSchema({ type: "string" }) as string,
    };
  }

  return {
    status: 415,
    contentType: "text/plain",
    body: "HTTP 415: Unsupported Media Type",
  };
};
