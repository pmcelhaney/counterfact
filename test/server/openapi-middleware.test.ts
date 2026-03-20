import Koa from "koa";
import request from "supertest";
import yaml from "js-yaml";

import { openapiMiddleware } from "../../src/server/openapi-middleware.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.ts";

describe("openapiMiddleware", () => {
  it("serves the OpenAPI document at /counterfact/openapi", async () => {
    await withTemporaryFiles(
      {
        "openapi.yaml":
          "openapi: '3.0.0'\ninfo:\n  title: Test\n  version: '1.0.0'\npaths: {}\n",
      },
      async (_, { path }) => {
        const app = new Koa();

        app.use(
          openapiMiddleware(path("openapi.yaml"), "//localhost:3100"),
        );

        const response = await request(app.callback()).get(
          "/counterfact/openapi",
        );

        expect(response.status).toBe(200);
        const doc = yaml.load(response.text) as { info: { title: string } };

        expect(doc.info.title).toBe("Test");
      },
    );
  });

  it("injects a Counterfact server entry", async () => {
    await withTemporaryFiles(
      {
        "openapi.yaml":
          "openapi: '3.0.0'\ninfo:\n  title: Test\n  version: '1.0.0'\npaths: {}\n",
      },
      async (_, { path }) => {
        const app = new Koa();

        app.use(
          openapiMiddleware(path("openapi.yaml"), "//localhost:3100"),
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
      },
    );
  });

  it("resolves external $ref references in the OpenAPI document", async () => {
    await withTemporaryFiles(
      {
        "openapi.yaml": [
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
        "components/metrics.yaml": [
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
      },
      async (_, { path }) => {
        const app = new Koa();

        app.use(
          openapiMiddleware(path("openapi.yaml"), "//localhost:3100"),
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
                        schema: { type: string; properties: object };
                      };
                    };
                  };
                };
              };
            };
          };
        };

        // The external $ref should be resolved - schema should have type: object
        expect(
          doc.paths["/metrics"].get.responses["200"].content[
            "application/json"
          ].schema.type,
        ).toBe("object");
      },
    );
  });

  it("does not handle requests to other paths", async () => {
    await withTemporaryFiles(
      {
        "openapi.yaml":
          "openapi: '3.0.0'\ninfo:\n  title: Test\n  version: '1.0.0'\npaths: {}\n",
      },
      async (_, { path }) => {
        const app = new Koa();

        app.use(
          openapiMiddleware(path("openapi.yaml"), "//localhost:3100"),
        );

        app.use((ctx) => {
          ctx.body = "fallthrough";
        });

        const response = await request(app.callback()).get("/other-path");

        expect(response.text).toBe("fallthrough");
      },
    );
  });
});
