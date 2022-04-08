import { ScriptedServer } from "../src/scripted-server";

describe("a scripted server", () => {
  it("knows if a path exists", () => {
    const server = new ScriptedServer();

    server.add("/hello", {});

    expect(server.exists("/hello")).toBe(true);
    expect(server.exists("/goodbye")).toBe(false);
  });

  it("looks up a get method", () => {
    const server = new ScriptedServer();

    server.add("/hello", {
      GET() {
        return { body: "hello" };
      },
    });

    expect(server.get("/hello")?.().body).toBe("hello");
  });
});
