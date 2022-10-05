import nodePath from "node:path";

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";
import yaml from "js-yaml";

import { counterfact } from "./counterfact.js";
import { readFile } from "./read-file.js";

const DEFAULT_PORT = 3100;

function swaggerUi(app, openApiPath, port) {
  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      const openApiDocument = await yaml.load(await readFile(openApiPath));

      openApiDocument.servers ??= [];

      openApiDocument.servers.unshift({
        description: "Counterfact",
        url: `//localhost:${port}`,
      });

      // eslint-disable-next-line require-atomic-updates
      ctx.body = yaml.dump(openApiDocument);

      return;
    }

    // eslint-disable-next-line node/callback-return
    await next();
  });

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    })
  );
}

export function landingPageBody(basePath) {
  return `
  <html>
    <head>
      <title>Counterfact</title>
      <style type="text/css">
        body {
          font-family: sans-serif;
        
          margin: 20vh;
          font-size: 3vh;
          text-align: center;
        }

        ul {
          list-style: none;
          margin: 0;
          line-height: 2em;
        }

       
      </style>
    </head>
    <body>
      <h1>Counterfact is running!</h1>
      <ul> 
        
        <li>The generated code is at<br><a href="vscode://file${basePath}">${basePath}</a></li>
        <li>You can explore the API using <a href="/counterfact/swagger">Swagger UI</a></li>
        <li><a href="https://github.com/pmcelhaney/counterfact/blob/main/docs/usage.md#generated-code-">How does this work?</a></li>
      </ul>  
    </body>
  </html>
`;
}

export function landingPage(app, basePath) {
  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      ctx.body = landingPageBody(basePath);

      return;
    }

    // eslint-disable-next-line node/callback-return
    await next();
  });
}

export async function start({
  basePath = process.cwd(),
  port = DEFAULT_PORT,
  openApiPath = nodePath.join(basePath, "../openapi.yaml"),
  includeSwaggerUi = false,
}) {
  const app = new Koa();

  if (includeSwaggerUi) {
    swaggerUi(app, openApiPath, port);
  }

  landingPage(app, basePath);

  app.use(bodyParser());

  const { koaMiddleware } = await counterfact(basePath, openApiPath);

  app.use(koaMiddleware);

  app.listen(port);
}
