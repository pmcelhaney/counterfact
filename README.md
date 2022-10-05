<div align="right">

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main) ![MIT License](https://img.shields.io/badge/license-MIT-blue)

</div>

<div align="center">

# Counterfact

_Front end development without back end headaches_

[Quick Start](#quick-start) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

Counterfact is a stand-in REST server powered by Node, TypeScript, and OpenAPI.<br>
It enables you to write front end code and test UX flows without a complete back end.

</div>

<br>

<table align="center" cols="2">

<tr>
<td>

💪 build the UI before the API or build both in parallel<br>
🏎️ quickly and cheaply prototype UX workflows<br>
🎉 turn OpenAPI docs into functional code

</td>

<td>

⛓️ write fast, repeatable UI integration tests<br>
🧑‍🔬 test UI code against hard-to-recreate edge cases<br>
🔌 plug into your existing toolchain

</td>

</tr>

</table>

<h2 id="quick-start">Got 60 Seconds? Try me!</h2>

Copy the following command into your terminal. The only prerequisite is Node 16+.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api --open
```

<details>
<summary>What does that command do?</summary>

1. installs the `@latest` version of `counterfact`
2. reads an [OpenAPI 3](https://oai.github.io/Documentation/) document (`https://petstore3.swagger.io/api/v3/openapi.json`)
3. generates TypeScript files in the `api` directory
4. starts a server which implements the API
5. opens your browser to [Swagger UI](https://swagger.io/tools/swagger-ui/) (`--open`)

You can use Swagger to try out the auto-generated API. Out of the box, it returns random responses using metadata from the OpenAPI document. Edit the files under `./api/paths` to add more realistic behavior. There's no need to restart the server.

</details>

<br>

📗 See [Usage](./docs/usage.md) for detailed documentation.

---

Counterfact is brand new as of October 5, 2022. Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new). If you like what you see, please give this project a star!
