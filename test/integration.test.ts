import { createServer } from "node:http";

import supertest from "supertest";
import Koa from "koa";

import { Registry } from "../src/registry";
import { Dispatcher } from "../src/dispatcher";
import { koaMiddleware } from "../src/koa-middleware";





describe("integration test", () => {
  it("finds a path", async () => {
    const registry = new Registry();
    registry.add("/hello", {
      async GET() {
        return await Promise.resolve({ body: "GET /hello" });
      },
    });

    registry.add("/hello/world", {
      async POST() {
        return await Promise.resolve({ body: "POST /hello/world" });
      },
    });
    const dispatcher = new Dispatcher(registry);
    const middleware = koaMiddleware(dispatcher);
    

    const app = new Koa();

    app.use(middleware);

    const server = app.listen();
    const request = supertest(server);
    expect((await request.get("/hello/world")).text).toBe("GET /hello");
    expect((await request.post("/hello/world")).text).toBe("POST /hello/world");
  
    server.close();

  
  });
});