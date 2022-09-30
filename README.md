[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main)

# Counterfact

Counterfact is a tool to help front end developers get ahead of the REST APIs on which they depend.

It reads an [OpenAPI](https://www.openapis.org/) document, then builds and runs a **TypeScript/Node** server which by default returns random, valid responses. You can then edit the TypeScript code in your IDE to add more realistic behavior. Unlike other, similar tools, Counterfact is **stateful and completely customizable**. Using the Swagger pet store as an example, you can `POST` a pet to `/pet` and `GET` that same pet via `/pet/{petId}` on the next request. It even supports _hot reloading on the server_, i.e. you can change behavior and see the difference immediately -- the server will see your code changes but won't drop the objects that were created on previous requests.

## Quick Start

Run this command to generate a server for the Swagger Pet Store. You can replace the URL below with a link or file path pointing to your own OpenAPI v3 document.

```sh
npx counterfact https://petstore3.swagger.io/api/v3/openapi.json api --open
```

---

## Status: September 29, 2022

The core functionality is in place and I'm planning to release [version 1.0](https://github.com/pmcelhaney/counterfact/milestone/3) next week. I'm working on [documentation](https://github.com/pmcelhaney/counterfact/issues/218#issuecomment-1260270411) now and will have a demo video up shortly.

🙏🏼 Please try out the command above and send me your first impressions. You can reach me at pmcelhaney@gmail.com or [open an issue](https://github.com/pmcelhaney/counterfact/issues/new).
