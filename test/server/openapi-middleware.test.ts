import Koa from "koa";
import request from "supertest";
import yaml from "js-yaml";

import { usingTemporaryFiles } from "using-temporary-files";

import { openapiMiddleware } from "../../src/server/openapi-middleware.js";

describe("openapiMiddleware", () => {
  it("serves the OpenAPI document at /counterfact/openapi", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "openapi.yaml",
        "openapi: '3.0.0'\ninfo:\n  title: Test\n  version: '1.0.0'\npaths: {}\n",
      );

      const app = new Koa();

      app.use(
        openapiMiddleware([
          { path: $.path("openapi.yaml"), baseUrl: "//localhost:3100" },
        ]),
      );

      const response = await request(app.callback()).get(
        "/counterfact/openapi",
      );

      expect(response.status).toBe(200);
      const doc = yaml.load(response.text) as { info: { title: string } };

      expect(doc.info.title).toBe("Test");
    });
  });

  it("injects a Counterfact server entry", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "openapi.yaml",
        "openapi: '3.0.0'\ninfo:\n  title: Test\n  version: '1.0.0'\npaths: {}\n",
      );

      const app = new Koa();

      app.use(
        openapiMiddleware([
          { path: $.path("openapi.yaml"), baseUrl: "//localhost:3100" },
        ]),
      );

      const response = await request(app.callback()).get(
        "/counterfact/openapi",
      );

      const doc = yaml.load(response.text) as {
        servers: { description: string; url: string }[];
      };

      expect(doc.servers[0]).toStrictEqual({
        description: "Counterfact",
        url: "//localhost:3100",
      });
    });
  });

  it("resolves external $ref references in the OpenAPI document", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "openapi.yaml",
        [
          "openapi: '3.0.0'",
          "info:",
          "  title: Test",
          "  version: '1.0.0'",
          "paths:",
          "  /metrics:",
          "    get:",
          "      responses:",
          "        '200':",
          "          description: Successful response",
          "          content:",
          "            application/json:",
          "              schema:",
          "                $ref: 'components/metrics.yaml#/components/schemas/MetricsResponse'",
        ].join("\n"),
      );
      await $.add(
        "components/metrics.yaml",
        [
          "components:",
          "  schemas:",
          "    MetricsResponse:",
          "      type: object",
          "      properties:",
          "        data:",
          "          type: array",
          "          items:",
          "            type: string",
        ].join("\n"),
      );

      const app = new Koa();

      app.use(
        openapiMiddleware([
          { path: $.path("openapi.yaml"), baseUrl: "//localhost:3100" },
        ]),
      );

      const response = await request(app.callback()).get(
        "/counterfact/openapi",
      );

      expect(response.status).toBe(200);

      const doc = yaml.load(response.text) as {
        paths: {
          "/metrics": {
            get: {
              responses: {
                "200": {
                  content: {
                    "application/json": {
                      schema: {
                        $ref?: string;
                        type?: string;
                        properties?: object;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };

      const schema =
        doc.paths["/metrics"].get.responses["200"].content["application/json"]
          .schema;

      // bundle() inlines external $refs - no external file reference should remain
      expect(schema.$ref).toBeUndefined();
      // The schema should be fully resolved with its type
      expect(schema.type).toBe("object");
    });
  });

  it("does not handle requests to other paths", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "openapi.yaml",
        "openapi: '3.0.0'\ninfo:\n  title: Test\n  version: '1.0.0'\npaths: {}\n",
      );

      const app = new Koa();

      app.use(
        openapiMiddleware([
          { path: $.path("openapi.yaml"), baseUrl: "//localhost:3100" },
        ]),
      );

      app.use((ctx) => {
        ctx.body = "fallthrough";
      });

      const response = await request(app.callback()).get("/other-path");

      expect(response.text).toBe("fallthrough");
    });
  });

  describe("with multiple documents", () => {
    it("serves each document at /counterfact/openapi/{id}", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "spec-a.yaml",
          "openapi: '3.0.0'\ninfo:\n  title: Spec A\n  version: '1.0.0'\npaths: {}\n",
        );
        await $.add(
          "spec-b.yaml",
          "openapi: '3.0.0'\ninfo:\n  title: Spec B\n  version: '1.0.0'\npaths: {}\n",
        );

        const app = new Koa();

        app.use(
          openapiMiddleware([
            {
              path: $.path("spec-a.yaml"),
              baseUrl: "//localhost:3100/a",
              id: "spec-a",
            },
            {
              path: $.path("spec-b.yaml"),
              baseUrl: "//localhost:3100/b",
              id: "spec-b",
            },
          ]),
        );

        const responseA = await request(app.callback()).get(
          "/counterfact/openapi/spec-a",
        );
        expect(responseA.status).toBe(200);
        const docA = yaml.load(responseA.text) as { info: { title: string } };
        expect(docA.info.title).toBe("Spec A");

        const responseB = await request(app.callback()).get(
          "/counterfact/openapi/spec-b",
        );
        expect(responseB.status).toBe(200);
        const docB = yaml.load(responseB.text) as { info: { title: string } };
        expect(docB.info.title).toBe("Spec B");
      });
    });

    it("does not serve at /counterfact/openapi when there are multiple documents", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "spec-a.yaml",
          "openapi: '3.0.0'\ninfo:\n  title: Spec A\n  version: '1.0.0'\npaths: {}\n",
        );
        await $.add(
          "spec-b.yaml",
          "openapi: '3.0.0'\ninfo:\n  title: Spec B\n  version: '1.0.0'\npaths: {}\n",
        );

        const app = new Koa();

        app.use(
          openapiMiddleware([
            {
              path: $.path("spec-a.yaml"),
              baseUrl: "//localhost:3100/a",
              id: "spec-a",
            },
            {
              path: $.path("spec-b.yaml"),
              baseUrl: "//localhost:3100/b",
              id: "spec-b",
            },
          ]),
        );

        app.use((ctx) => {
          ctx.body = "fallthrough";
        });

        const response = await request(app.callback()).get(
          "/counterfact/openapi",
        );

        expect(response.text).toBe("fallthrough");
      });
    });

    it("injects the correct baseUrl for each document", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "spec-a.yaml",
          "openapi: '3.0.0'\ninfo:\n  title: Spec A\n  version: '1.0.0'\npaths: {}\n",
        );
        await $.add(
          "spec-b.yaml",
          "openapi: '3.0.0'\ninfo:\n  title: Spec B\n  version: '1.0.0'\npaths: {}\n",
        );

        const app = new Koa();

        app.use(
          openapiMiddleware([
            {
              path: $.path("spec-a.yaml"),
              baseUrl: "//localhost:3100/a",
              id: "spec-a",
            },
            {
              path: $.path("spec-b.yaml"),
              baseUrl: "//localhost:3100/b",
              id: "spec-b",
            },
          ]),
        );

        const responseA = await request(app.callback()).get(
          "/counterfact/openapi/spec-a",
        );
        const docA = yaml.load(responseA.text) as {
          servers: { description: string; url: string }[];
        };
        expect(docA.servers[0]).toStrictEqual({
          description: "Counterfact",
          url: "//localhost:3100/a",
        });

        const responseB = await request(app.callback()).get(
          "/counterfact/openapi/spec-b",
        );
        const docB = yaml.load(responseB.text) as {
          servers: { description: string; url: string }[];
        };
        expect(docB.servers[0]).toStrictEqual({
          description: "Counterfact",
          url: "//localhost:3100/b",
        });
      });
    });
  });
});
