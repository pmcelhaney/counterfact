import supertest from "supertest";
import Koa from "koa";

import { Registry } from "../src/registry";
import { Dispatcher } from "../src/dispatcher";
import { koaMiddleware } from "../src/koa-middleware";
import { Loader } from "../src/loader";

import { withTemporaryFiles } from "./lib/with-temporary-files";


describe("integration test", () => {
  it("finds a path", async () => {

    const app = new Koa();
    const server = app.listen();
    const request = supertest(server);


    const files = {
      "hello.mjs": `
        export async function GET() {
          return await Promise.resolve({ body: "GET /hello" });
        }
      `,
      "hello/world.mjs": `
        export async function POST() {
          return await Promise.resolve({ body: "POST /hello/world" });
        }
      `
    };

    await withTemporaryFiles(files, async (basePath) => {
      const registry = new Registry();
      const dispatcher = new Dispatcher(registry);
      const middleware = koaMiddleware(dispatcher);  
      const loader = new Loader(basePath, registry);
      await loader.load();

      app.use(middleware);
      
      expect((await request.get("/hello/world")).text).toBe("GET /hello");
      expect((await request.post("/hello/world")).text).toBe("POST /hello/world");
  

    })
    server.close();
 

  
  });
});