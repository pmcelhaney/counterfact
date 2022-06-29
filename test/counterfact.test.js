import supertest from "supertest";
import Koa from "koa";

import { counterfact } from "../src/counterfact.js";

import { withTemporaryFiles } from "./lib/with-temporary-files.js";

describe("integration test", () => {
  it("finds a path", async () => {
    const app = new Koa();
    const request = supertest(app.callback());
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
      `,
      "teapot.mjs": `
      export async function POST() {
        return await Promise.resolve({ status: 418, body: "I am a teapot." });
      }
    `,
    };

    await withTemporaryFiles(files, async (basePath) => {
      const { koaMiddleware, moduleLoader } = await counterfact(basePath);

      app.use(koaMiddleware);

      const getResponse = await request.get("/hello");
      const postResponse = await request.post("/hello/world");
      const teapotResponse = await request.post("/teapot");

      expect(getResponse.text).toBe("GET /hello");
      expect(postResponse.text).toBe("POST /hello/world");
      expect(teapotResponse.statusCode).toBe(418);

      await moduleLoader.stopWatching();
    });
  });

  it("loads the initial context", async () => {
    const app = new Koa();
    const request = supertest(app.callback());
    const files = {
      "paths/hello.mjs": `
        export async function GET({context}) {
          return await Promise.resolve({ body: "Hello " + context.name });
        }
      `,
    };

    await withTemporaryFiles(files, async (basePath) => {
      const { koaMiddleware, moduleLoader } = await counterfact(
        `${basePath}/paths`,
        { name: "World" }
      );

      app.use(koaMiddleware);

      const getResponse = await request.get("/hello");

      expect(getResponse.text).toBe("Hello World");

      await moduleLoader.stopWatching();
    });
  });
});
