import { Dispatcher } from "../src/dispatcher";
import { ScriptedServer } from "../src/scripted-server";

describe("a dispatcher", () => {
  it("dispatches a get request to a server and returns the response", () => {
    const server = new ScriptedServer();

    server.add("/hello", {
      GET() {
        return { body: "hello" };
      },
    });

    const dispatcher = new Dispatcher(server);

    expect(dispatcher.request({ method: "GET", path: "/hello" }).body).toBe(
      "hello"
    );
  });

  it("goes up one level and keeps searching if it doesn't find an exact match", () => {
    const server = new ScriptedServer();

    server.add("/a", {
      GET() {
        return { body: "found a match at /a" };
      },
    });

    server.add("/a/b", {
      GET() {
        return { body: "found a match at /a/b" };
      },
    });

    const dispatcher = new Dispatcher(server);

    expect(dispatcher.request({ method: "GET", path: "/a/b/c/d" }).body).toBe(
      "found a match at /a/b"
    );
  });

  it("passes the remainder of the path to the request", () => {
    const server = new ScriptedServer();

    server.add("/a", {
      GET({ path }) {
        return { body: `the rest of the path is '${path}'` };
      },
    });

    const dispatcher = new Dispatcher(server);

    expect(dispatcher.request({ method: "GET", path: "/a/b/c/d" }).body).toBe(
      "the rest of the path is 'b/c/d'"
    );
  });
});
