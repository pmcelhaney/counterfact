import net from "node:net";

import { RawHttpClient } from "../../src/repl/RawHttpClient.js";

/**
 * Starts a minimal TCP server that accepts one connection,
 * captures the raw request text, immediately responds with
 * a minimal HTTP 200, and resolves with the captured request.
 */
function captureRequest(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      let raw = "";

      socket.on("data", (chunk) => {
        raw += chunk.toString("utf8");

        // Respond once we have a complete HTTP request head
        if (raw.includes("\r\n\r\n")) {
          socket.write(
            "HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
          );
          socket.end();
          server.close();
          resolve(raw);
        }
      });

      socket.on("error", reject);
    });

    server.listen(port);
  });
}

describe("RawHttpClient", () => {
  it("automatically adds Content-Type: application/json when body is an object", async () => {
    const port = 59_100;
    const capture = captureRequest(port);
    const client = new RawHttpClient("localhost", port);

    client.post("/test", { name: "Homer" });

    const raw = await capture;

    expect(raw).toMatch(/content-type:\s*application\/json/i);
  });

  it("does not override an explicit content-type header provided by the caller", async () => {
    const port = 59_101;
    const capture = captureRequest(port);
    const client = new RawHttpClient("localhost", port);

    client.post("/test", { name: "Homer" }, { "Content-Type": "text/plain" });

    const raw = await capture;

    // Should carry exactly what the caller specified
    expect(raw).toMatch(/content-type:\s*text\/plain/i);
    // And must NOT duplicate application/json
    expect(raw).not.toMatch(/application\/json/i);
  });

  it("does not add Content-Type when body is a plain string", async () => {
    const port = 59_102;
    const capture = captureRequest(port);
    const client = new RawHttpClient("localhost", port);

    client.post("/test", "raw string body");

    const raw = await capture;

    expect(raw).not.toMatch(/content-type/i);
  });

  it("sends Content-Type: application/json for PUT with object body", async () => {
    const port = 59_103;
    const capture = captureRequest(port);
    const client = new RawHttpClient("localhost", port);

    client.put("/test", { id: 1 });

    const raw = await capture;

    expect(raw).toMatch(/content-type:\s*application\/json/i);
  });

  it("sends Content-Type: application/json for PATCH with object body", async () => {
    const port = 59_104;
    const capture = captureRequest(port);
    const client = new RawHttpClient("localhost", port);

    client.patch("/test", { id: 1 });

    const raw = await capture;

    expect(raw).toMatch(/content-type:\s*application\/json/i);
  });
});
