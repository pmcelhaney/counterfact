import type { HTTP_GET } from "../../../types/paths/weird/path/with:colon.types.js";

export const GET: HTTP_GET = async ($) => {
  return $.response[200].random();
};
