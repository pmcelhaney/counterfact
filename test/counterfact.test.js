import supertest from "supertest";
import Koa from "koa";

import { counterfact } from "../src/counterfact.js";

import { withTemporaryFiles } from "./lib/with-temporary-files.js";

describe("integration test", () => {
  it("finds a path", async () => {
    const app = new Koa();
    const request = supertest(app.callback());
    const files = {
      "paths/hello.mjs": `
        export async function GET() {
          return await Promise.resolve({ body: "GET /hello" });
        }
      `,
      "paths/hello/world.mjs": `
        export async function POST() {
          return await Promise.resolve({ body: "POST /hello/world" });
        }
      `,
      "paths/teapot.mjs": `
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

  it("uses an OpenAPI document to generate a random response", async () => {
    const app = new Koa();
    const request = supertest(app.callback());
    const files = {
      "openapi.yaml": `
        openapi: 3.0.0
        info:
          title: Counterfact
          version: 1.0.0
        paths:
          /hello:
            get:
              responses:
                200:
                  content:
                    text/plain:
                      schema:
                        $ref: "#/components/schemas/Hello"
        components:
          schemas:
            Hello: 
              type: string
              examples: 
                - "hello"
      `,

      "paths/hello.mjs": `
        export async function GET({response}) {
          return response[200].random();
        }
      `,
    };

    await withTemporaryFiles(files, async (basePath) => {
      const { koaMiddleware, moduleLoader } = await counterfact(
        basePath,
        `${basePath}/openapi.yaml`
      );

      app.use(koaMiddleware);

      const getResponse = await request.get("/hello");

      expect(getResponse.text).toBe("hello");

      await moduleLoader.stopWatching();
    });
  });
});
