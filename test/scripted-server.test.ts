import { ScriptedServer } from "../src/scripted-server";

describe("a scripted server", () => {
  it("knows if a hanlder exists for a request method at a path", () => {
    const server = new ScriptedServer();

    server.add("/hello", {
      GET() {
        return { body: "hello" };
      },
    });

    expect(server.exists("GET", "/hello")).toBe(true);
    expect(server.exists("POST", "/hello")).toBe(false);
    expect(server.exists("GET", "/goodbye")).toBe(false);
  });

  it.todo("returns debug information if path does not exist");

  it("returns a function matching the URL and request method", () => {
    const server = new ScriptedServer();

    server.add("/a", {
      GET() {
        return { body: "GET a" };
      },

      POST() {
        return { body: "POST a" };
      },
    });

    server.add("/b", {
      GET() {
        return { body: "GET b" };
      },

      POST() {
        return { body: "POST b" };
      },
    });

    expect(server.endpoint("GET", "/a")().body).toBe("GET a");
    expect(server.endpoint("GET", "/b")().body).toBe("GET b");
    expect(server.endpoint("POST", "/a")().body).toBe("POST a");
    expect(server.endpoint("POST", "/b")().body).toBe("POST b");
  });
});
