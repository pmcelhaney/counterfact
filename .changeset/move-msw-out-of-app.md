---
"counterfact": patch
---

Move MSW (Mock Service Worker) code out of `app.ts` into a dedicated `src/msw.ts` module. The `MockRequest` type, `handleMswRequest`, and `createMswHandlers` are still re-exported from `app.ts` for backward compatibility. Tests for these functions have been moved to `test/msw.test.ts`.
