import { PassThrough } from "node:stream";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { startRepl } from "../../src/server/repl.js";

describe("the REPL", () => {
  it("starts", (done) => {
    const output = new PassThrough();

    output.on("data", (chunk) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      expect(chunk.toString()).toEqual("counterfact> ");
      done();
    });

    startRepl(
      new ContextRegistry(),
      {
        proxyEnabled: false,
        proxyUrl: "",
      },
      // @ts-expect-error - PassThrough is not a TTY but it's good enough for this test
      { output },
    );
  });

  it("defines a .counterfact command", (done) => {
    const output = new PassThrough();

    let chunks = 0;

    output.on("data", (chunk) => {
      if (chunks === 1) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        expect(chunk.toString()).toContain(
          "This is a read-eval-print loop (REPL)",
        );
        done();
      }
      chunks += 1;
    });

    const replServer = startRepl(
      new ContextRegistry(),
      {
        proxyEnabled: false,
        proxyUrl: "",
      },
      // @ts-expect-error - PassThrough is not a TTY but it's good enough for this test
      { output },
    );

    replServer.commands.counterfact?.action.call(replServer);
  });
});
