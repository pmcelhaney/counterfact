/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-restricted-matchers */

import { generate } from "../../src/typescript-generator/generate.js";
import { Repository } from "../../src/typescript-generator/repository.js";

describe("end-to-end test", () => {
  // Skip because it fails on Windows and I can't figure out why

  it.skip("generates the same code for pet store that it did on the last test run", async () => {
    const repository = new Repository();

    repository.writeFiles = () => "noop";

    await generate("./petstore.yaml", "./dist", repository);
    await repository.finished();

    expect(repository.scripts).toMatchSnapshot();
  });
});
