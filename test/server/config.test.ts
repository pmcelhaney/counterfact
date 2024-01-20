import { DUMMY_EXPORT_FOR_TEST_COVERAGE } from "../../src/server/config.js";

it("does nothing, just including because C8 coverage doesn't recognize type-only files", () => {
  expect(DUMMY_EXPORT_FOR_TEST_COVERAGE).toBe(DUMMY_EXPORT_FOR_TEST_COVERAGE);
});
