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
});
