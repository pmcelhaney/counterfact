import type { HTTP_GET } from "./../../path-types/store/inventory.types.js";
export const GET: HTTP_GET = ({ response }) => { 
  const x = response[200].json({"ok": 1})
  return x;
};
