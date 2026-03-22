import type { HTTP_GET } from "../types/paths/count.types.js";

export const GET: HTTP_GET = async ($) => {
  return $.response[200].random();
};
