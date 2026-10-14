import { EventEmitter } from "node:events";
import type { REPLServer } from "node:repl";

import { describe, expect, it, jest } from "@jest/globals";
import { usingTemporaryFiles } from "using-temporary-files";

import {
  attachTutorial,
  findDemoDirectory,
  prepareDemo,
  TutorialProgress,
} from "../../src/cli/tutorial.js";

const response = (status: string, id = 1) =>
  `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ id, status })}`;

it("creates a restartable offline example without touching an existing project", async () => {
  await usingTemporaryFiles(async ($) => {
    await $.add("counterfact-demo/keep.txt", "user edits");
    await $.add("counterfact-demo-2", "an existing file");
    const directory = await findDemoDirectory($.path("."));
    expect(directory).toBe("counterfact-demo-3");
    await prepareDemo($.path("."), directory);
    expect(await $.read("counterfact-demo/keep.txt")).toBe("user edits");
    const spec = JSON.parse(await $.read(`${directory}/openapi.json`));
    expect(
      spec.paths["/tickets/{ticketId}"].get.responses["200"],
    ).toBeDefined();
    expect(await $.read(`${directory}/routes/tickets/{ticketId}.ts`)).toContain(
      'status: "open"',
    );
    await expect(prepareDemo($.path("."), directory)).rejects.toMatchObject({
      code: "EEXIST",
    });
  });
});

describe("tutorial evidence", () => {
  it("requires the initial request and a subsequent changed response", () => {
    const tutorial = new TutorialProgress();
    tutorial.observe("/tickets/1", response("closed"));
    expect(tutorial.step).toBe("request");
    tutorial.observe("/tickets/2", response("open", 2));
    expect(tutorial.step).toBe("request");
    tutorial.observe("/tickets/1", response("open"));
    expect(tutorial.step).toBe("edit");
    tutorial.observe("/tickets/1", response("open"));
    expect(tutorial.step).toBe("edit");
    tutorial.observe("/tickets/1", response("closed"));
    expect(tutorial.step).toBe("complete");
  });

  it.each([
    "HTTP/1.1 500 Error\r\n\r\n{}",
    "HTTP/1.1 200 OK\r\n\r\nnot json",
    "HTTP/1.1 200 OK\r\n\r\nnull",
    response("closed", 2),
    "incomplete response",
  ])("keeps the edit step after an unsuccessful response: %s", (raw) => {
    const tutorial = new TutorialProgress();
    tutorial.observe("/tickets/1", response("open"));
    expect(tutorial.observe("/tickets/1", raw)).toBeDefined();
    expect(tutorial.step).toBe("edit");
    tutorial.observe("/tickets/1", response("closed"));
    expect(tutorial.step).toBe("complete");
  });
});

it("preserves client arguments, results and errors, and restores the client on skip", async () => {
  const get = jest
    .fn<(path: string, headers?: object) => Promise<string>>()
    .mockResolvedValue(response("open"));
  const client = { get };
  const writes: string[] = [];
  let tutorialCommand:
    { action: (this: REPLServer, argument: string) => void } | undefined;
  const repl = Object.assign(new EventEmitter(), {
    context: { client },
    writer: (value: unknown) => String(value),
    output: { write: (text: string) => writes.push(text) },
    displayPrompt: jest.fn(),
    defineCommand: (_name: string, command: typeof tutorialCommand) => {
      tutorialCommand = command;
    },
  }) as unknown as REPLServer;
  attachTutorial(repl, "example", 3210);
  const headers = { Authorization: "test" };
  expect(await client.get("/tickets/1", headers)).toBe(response("open"));
  expect(get).toHaveBeenCalledWith("/tickets/1", headers);
  expect(repl.writer(response("open"))).toBe("");
  expect(repl.writer("another result")).toBe("another result");
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(writes.join("\n")).toContain("example/routes/tickets/{ticketId}.ts");
  const error = new Error("connection refused");
  get.mockRejectedValueOnce(error);
  await expect(client.get("/tickets/1")).rejects.toBe(error);
  tutorialCommand!.action.call(repl, "skip");
  expect(client.get).toBe(get);
  expect(repl.writer(response("open"))).toBe(response("open"));
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(writes.join("\n")).toContain("Tutorial skipped");
  expect(writes.join("\n")).not.toContain("3/3 —");
});

it("restores the normal client when the REPL exits", () => {
  const get = jest.fn<() => Promise<string>>();
  const client = { get };
  const repl = Object.assign(new EventEmitter(), {
    context: { client },
    writer: (value: unknown) => String(value),
    output: { write: jest.fn() },
    displayPrompt: jest.fn(),
    defineCommand: jest.fn(),
  }) as unknown as REPLServer;
  attachTutorial(repl, "example", 3210);
  repl.emit("exit");
  expect(client.get).toBe(get);
});
