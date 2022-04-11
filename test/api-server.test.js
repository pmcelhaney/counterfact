import { ApiServer } from "../src/api-server";

describe("a scripted server", () => {
  it("knows if a handler exists for a request method at a path", () => {
    const server = new ApiServer();

    server.add("/hello", {
      async GET() {
        return await Promise.resolve({ body: "hello" });
      },
    });

    expect(server.exists("GET", "/hello")).toBe(true);
    expect(server.exists("POST", "/hello")).toBe(false);
    expect(server.exists("GET", "/goodbye")).toBe(false);
  });

  it.todo("returns debug information if path does not exist");

  it("returns a function matching the URL and request method", async () => {
    const server = new ApiServer();

    server.add("/a", {
      async GET() {
        return await Promise.resolve({ body: "GET a" });
      },

      async POST() {
        return await Promise.resolve({ body: "POST a" });
      },
    });

    server.add("/b", {
      async GET() {
        return await Promise.resolve({ body: "GET b" });
      },

      async POST() {
        return await Promise.resolve({ body: "POST b" });
      },
    });

    const getA = await server.endpoint("GET", "/a")({ path: "" });
    const getB = await server.endpoint("GET", "/b")({ path: "" });
    const postA = await server.endpoint("POST", "/a")({ path: "" });
    const postB = await server.endpoint("POST", "/b")({ path: "" });

    expect(getA.body).toBe("GET a");
    expect(getB.body).toBe("GET b");
    expect(postA.body).toBe("POST a");
    expect(postB.body).toBe("POST b");
  });
});
