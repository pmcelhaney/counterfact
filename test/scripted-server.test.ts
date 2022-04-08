import { ScriptedServer } from "../src/scripted-server";

describe("a scripted server", () => {
  it("knows if a path exists", () => {
    const server = new ScriptedServer();

    server.add("/hello", {});

    expect(server.exists("/hello")).toBe(true);
    expect(server.exists("/goodbye")).toBe(false);
  });

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
