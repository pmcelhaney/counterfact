# Got 60 Seconds? Try me!

Copy the following command into your terminal. The only prerequisite is Node 16+.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

## What does that command do?

1. installs the `@latest` version of `counterfact`
2. reads an [OpenAPI 3](https://oai.github.io/Documentation/) document (`https://petstore3.swagger.io/api/v3/openapi.json`)
3. generates TypeScript files in the `api` directory
4. starts a server which implements the API

You can use [Swagger UI](https://swagger.io/tools/swagger-ui/) to try out the auto-generated API. Out of the box, it returns random responses using metadata from the OpenAPI document. Edit the files under `./api/routes` to add more realistic behavior. There's no need to restart the server.

To learn more, see the [Usage Guide](./usage.md).
