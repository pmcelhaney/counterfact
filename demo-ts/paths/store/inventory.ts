import type { HTTP_GET } from "./../../path-types/store/inventory.types.js";
export const GET: HTTP_GET = ({ response }) => { 
  return response[200].json({"ok": 1})
};
