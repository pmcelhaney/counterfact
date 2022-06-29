import type { HTTP_GET } from "./kitty.types";

export const GET: HTTP_GET = () => ({
  body: '<img src="https://upload.wikimedia.org/wikipedia/en/0/05/Hello_kitty_character_portrait.png">',
});
