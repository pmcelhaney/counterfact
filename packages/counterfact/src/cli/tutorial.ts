/* eslint-disable security/detect-non-literal-fs-filename -- Tutorial files are written only inside an exclusively created demo directory. */
import fs from "node:fs/promises";
import net from "node:net";
import { join } from "node:path";
import type { REPLServer } from "node:repl";

import { coffeeShopFiles, SHOP_DOCUMENT } from "./coffee-shop.js";

import type { RawHttpClient } from "@counterfact/client";

export const TUTORIAL_ROUTE = "routes/tickets/{ticketId}.ts";
const DOCS_URL = "https://counterfact.dev/docs/first-10-minutes/";
const REQUEST = 'await client.get("/tickets/1")';

// Compiled into the shipped CLI: no network or repository-only asset is needed.
const document = {
  openapi: "3.0.3",
  info: { title: "Counterfact guided example", version: "1.0.0" },
  paths: {
    "/tickets/{ticketId}": {
      get: {
        parameters: [
          {
            name: "ticketId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "A support ticket",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "title", "status"],
                  properties: {
                    id: { type: "integer" },
                    title: { type: "string" },
                    status: { type: "string", enum: ["open", "closed"] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
const handler = `import type { HTTP_GET } from "../../types/paths/tickets/{ticketId}.types.js";

export const GET: HTTP_GET = ($) =>
  $.response[200].json({
    id: $.path.ticketId,
    title: "Reset password",
    status: "open",
  });
`;

export async function findDemoDirectory(root: string): Promise<string> {
  for (let suffix = 1; ; suffix++) {
    const name =
      suffix === 1 ? "counterfact-demo" : `counterfact-demo-${suffix}`;
    try {
      await fs.lstat(join(root, name));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return name;
      throw error;
    }
  }
}

export async function prepareDemo(
  root: string,
  directory: string,
): Promise<void> {
  const destination = join(root, directory);
  // Exclusive creation also protects an existing file, directory, or symlink.
  await fs.mkdir(destination);
  await fs.mkdir(join(destination, "routes/tickets"), { recursive: true });
  await fs.writeFile(
    join(destination, "openapi.json"),
    JSON.stringify(
      { ...document, paths: { ...document.paths, ...SHOP_DOCUMENT.paths } },
      null,
      2,
    ),
  );
  await fs.writeFile(join(destination, TUTORIAL_ROUTE), handler);
  for (const [file, contents] of Object.entries(coffeeShopFiles(destination))) {
    await fs.mkdir(join(destination, file, ".."), { recursive: true });
    await fs.writeFile(join(destination, file), contents);
  }
}

export async function isPortAvailable(port: number): Promise<boolean> {
  const probe = (host: string): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.once("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") resolve(false);
        else if (
          host === "::" &&
          ["EAFNOSUPPORT", "EADDRNOTAVAIL"].includes(error.code ?? "")
        )
          resolve(true);
        else reject(error);
      });
      server.listen({ port, host }, () =>
        server.close((error) => (error ? reject(error) : resolve(true))),
      );
    });
  // Some platforms permit an IPv6 listener alongside an occupied IPv4 port.
  return (await probe("0.0.0.0")) && (await probe("::"));
}

export class TutorialProgress {
  step: "request" | "edit" | "complete" | "skipped" = "request";

  observe(path: string, raw: string): string | undefined {
    if (
      path !== "/tickets/1" ||
      this.step === "complete" ||
      this.step === "skipped"
    )
      return undefined;
    const separator = raw.indexOf("\r\n\r\n");
    if (separator < 0 || !/^HTTP\/\d(?:\.\d)? 200\b/u.test(raw))
      return "The request did not succeed. Check the error above, then try again.";
    let ticket: { id?: unknown; status?: unknown } | null;
    try {
      ticket = JSON.parse(raw.slice(separator + 4)) as typeof ticket;
    } catch {
      return "The response was not valid JSON. Check the handler and try again.";
    }
    if (!ticket || ticket.id !== 1)
      return "Expected ticket 1. Check the handler and try again.";
    if (this.step === "request" && ticket.status === "open") {
      this.step = "edit";
      return "You received ticket 1 from your local API.";
    }
    if (this.step === "edit" && ticket.status === "closed") {
      this.step = "complete";
      return "Your saved change is live — no server restart needed.";
    }
    return this.step === "edit"
      ? "The ticket is not closed yet. Check the route file, save it, and retry the request."
      : 'Expected status "open". Restore the starter response and retry the request.';
  }
}

export function attachTutorial(
  repl: REPLServer,
  directory: string,
  port: number,
): void {
  const progress = new TutorialProgress();
  const client = repl.context["client"] as RawHttpClient;
  const originalGet = client.get;
  const originalWriter = repl.writer;
  // Node exposes a writable writer at runtime; its declarations mark it readonly.
  const presentation = repl as { writer: REPLServer["writer"] };
  let displayedResponse: string | undefined;
  // The HTTP client already prints its response. Avoid a second escaped dump
  // while preserving the actual return value and all other REPL results.
  presentation.writer = (value: unknown) => {
    const alreadyPrinted =
      typeof value === "string" && value === displayedResponse;
    displayedResponse = undefined;
    return alreadyPrinted ? "" : originalWriter.call(repl, value);
  };
  let active = true;
  const scheduled = new Set<ReturnType<typeof setImmediate>>();
  const write = (text: string) => repl.output.write(`\n${text}\n`);
  const instruction = () => {
    if (progress.step === "request") {
      write(
        `1/3 — Make a request\nType this at the ⬣> prompt, then press Enter:\n\n  ${REQUEST}\n\nYou should see ticket 1 with status "open".`,
      );
    } else if (progress.step === "edit") {
      write(
        `2/3 — Change the response\nOpen this file in your editor:\n\n  ${directory}/${TUTORIAL_ROUTE}\n\nChange status: "open" to status: "closed" and save.\nThen type the same request here:\n\n  ${REQUEST}`,
      );
    } else if (progress.step === "complete") {
      write(
        `3/3 — You changed a running API\nKeep experimenting here, or point your frontend at http://localhost:${port}.\nYour files are in ${directory}/. To restart this project:\n\n  npx counterfact ./${directory}/openapi.json ./${directory}\n\nNext: ${DOCS_URL}`,
      );
    } else {
      write(
        "Tutorial skipped. Your API and REPL are still running; your files are kept.",
      );
    }
  };
  const detach = () => {
    active = false;
    client.get = originalGet;
    presentation.writer = originalWriter;
    displayedResponse = undefined;
    for (const immediate of scheduled) clearImmediate(immediate);
    scheduled.clear();
  };
  client.get = async (path, headers) => {
    let raw: string;
    try {
      raw = await originalGet.call(client, path, headers);
    } catch (error) {
      if (active && path === "/tickets/1")
        notify(
          "The request failed. Check the error, then retry the same command.",
          false,
        );
      throw error;
    }
    if (active) {
      if (path === "/tickets/1") displayedResponse = raw;
      const previous = progress.step;
      const message = progress.observe(path, raw);
      if (message) notify(message, progress.step !== previous);
    }
    return raw;
  };
  function notify(message: string, advanced: boolean) {
    const immediate = setImmediate(() => {
      scheduled.delete(immediate);
      if (!active) return;
      write(message);
      if (advanced) instruction();
      if (progress.step === "complete") detach();
      repl.displayPrompt(true);
    });
    scheduled.add(immediate);
  }
  repl.defineCommand("tutorial", {
    help: "Show the current tutorial step; repeat or skip the tutorial",
    action(argument) {
      if (argument.trim() === "skip" && active) {
        progress.step = "skipped";
        detach();
      } else if (
        argument.trim() &&
        !["repeat", "skip"].includes(argument.trim())
      ) {
        write("Use .tutorial, .tutorial repeat, or .tutorial skip.");
      }
      instruction();
      if (active)
        write(
          "Help: .tutorial | Repeat: .tutorial repeat | Leave the tutorial: .tutorial skip",
        );
      this.displayPrompt(true);
    },
  });
  repl.once("exit", detach);
  write(
    "Your example API is ready. Keep this terminal open and use your editor for the next step.",
  );
  instruction();
  write(
    "Help: .tutorial | Repeat: .tutorial repeat | Leave the tutorial: .tutorial skip",
  );
  repl.displayPrompt(true);
}
