import Koa from "koa";
import supertest from "supertest";

describe("x", () => {
  it("koa test", async () => {
    const app = new Koa();

    app.use((ctx) => {
      ctx.body = "Hello World";
    });

    const server = app.listen();
    const request = supertest(server);
    const response = await request.get("/");
    server.close();

    expect(response.status).toBe(200);
  });
});
