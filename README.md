<div align="center" markdown="1">

# Counterfact is the mock server that front end engineers need to be productive

[Quick Start](./docs/quick-start.md) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

</div>

<br>

<div align="center"  markdown="1">

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main) ![MIT License](https://img.shields.io/badge/license-MIT-blue)

</div>

> TL;DR: Do you have Node 16+ installed? Run this command.
>
> ```sh copy
> npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.yaml api --open
> ```

## High code, low effort, mock REST APIs

Having worked on several different teams at companies large and small, I found a consistent frustrating pattern:
**When I was working on frontend code, I spent more time fiddling with the backend so that I could test the frontend than I did building features and fixing bugs.** In order to move faster, I started creating lightweight mock services in Node that I could use in development. That of course meant maintaining two back ends -- the real one and the mocks -- trading one problem for another.

However, over the course of several years, I found ways to minimize the effort to create and maintain mocks. For example, if the APIs are documented with OpenAPI / Swagger (they should be!) we can use that documentation to automatically generate TypeScript code. Since a mock server doesn't need to scale or be secure, we can optimize everything around developer experience. These optimizations have culminated in **Counterfact, the fastest and easiest way to build and maintain mock REST APIs.**

|                                                   | Real Backend                     | Counterfact Backend         |
| ------------------------------------------------- | -------------------------------- | --------------------------- |
| To front end code it's...                         | a fully functional REST API      | a fully functional REST API |
| Secure, scalable, robust, etc.                    | yes (🤞)                         | doesn't need to be          |
| Cost to build / prototype                         | $$$$$                            | $                           |
| Implementing a typical feature takes              | days? weeks?                     | minutes                     |
| Can be gradually replaced with production code    | -                                | yes                         |
| Running locally requires                          | runtime, database, etc.          | node                        |
| Maintainable by front end devs                    | maybe?                           | yes                         |
| See code changes                                  | after compile + restart / deploy | when you hit save           |
| Change server-side code without losing state      | wait, what?                      | yes (hot reload)            |
| Interact with the server in a REPL                | not likely                       | yes                         |
| Reproducing weird stuff that happened in prod     | hard / impossible                | easy                        |
| API response time                                 | varies                           | immediate                   |
| Maintaining test accounts is                      | a huge pain                      | optional                    |
| Integrates with UI tests (Jest, Playwright, etc.) | no                               | [planned]                   |
| Seed with test data / scenarios                   | much slower if possible at all   | [planned]                   |
| Optimized for                                     | end users                        | developers                  |
| Developer experience                              | <big>😣</big>                    | <big>😁</big>               |

<details>
<summary>What's wrong with the status quo?</summary>

- A typical web application these days spans multiple microservices, databases, etc. Standing up the whole stack locally takes a lot of effort (and defeats one of the main benefits of microservices).
- It's not uncommon for teams to run the front end locally and point to an API on a dev or QA server. Multiple developers working against the same backend with shared state is a recipe for disaster.
- Getting the back end in a state necessary to test functionality in the front end is tedious and time consuming, if not impossible.
- A mock server can help. But a mock server that returns random or predetermined responses can only get us so far. For testing multiple step workflows, sometimes we need a real server, or something that mimics the behavior of a real server. Ideally, we want something that mimics a real server except when we want it to behave in a controlled, predictable manner.
- From a customer's point of view, the frontend _is_ the app. If we can build the frontend without first having a backend in place, we can reduce cycle time and overproduction significantly.
- On some level, you got into software development because its _fun_. Don't you wish you could spend more time on the fun aspects of writing code and less time on tedious set up and testing?

</ul>

</details>

## Usage

The only prerequisite is Node 16+.

### In a few seconds

<details open>
<summary>Turn an OpenAPI / Swagger spec into a mock server me</summary>

For example, run the following command to generate code for the [Swagger Petstore](https://petstore.swagger.io/).

```sh
  npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.yaml api --open
```

That command generates and starts a TypeScript implementation of the Swagger Petstore which returns random, valid responses, outputting code to the "api" directory, and opens a web browser with tools to interact with the API. You can replace the Petstore URL with a link to your own spec, either a URL or a local file. OpenAPI / Swagger versions 2 and 3 are supported.

</details>

<details>
<summary>Generate TypeScript types</summary>

Again, using the [Swagger Petstore](https://petstore.swagger.io/) as an example:

```sh
  npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.yaml api
```

Counterfact reads the components from the [spec](https://petstore3.swagger.io/api/v3/openapi.yaml) and converts them into equivalent TypeScript types. For example, here's `./api/components/Pet.ts`:

```ts
import type { Category } from "./Category.js";
import type { Tag } from "./Tag.js";

export type Pet = {
  id?: number;
  name: string;
  category?: Category;
  photoUrls: Array<string>;
  tags?: Array<Tag>;
  status?: "available" | "pending" | "sold";
};
```

These types are used internally by Counterfact. You can also use them in your client-side code if you like.

</details>

<details>
<summary>Toggle between mocks and real services</summary>

Add the `--proxy-url <url>` flag to point to the location of a real server.

```sh
  npx counterfact@latest ./path/to/your/spec api --proxy-url https://your-server.example.com/
```

All requests will be proxied to the real server, e.g. a request to `http://localhost/hello-world` will be routed to `https://your-server.example.com/`. To toggle between having Counterfact handle requests and having it hand them off to the real server, type `.proxy on` / `.proxy off` in the REPL.

See the [usage guide](./docs/usage.md#proxy-peek-a-boo-) for more information.

</details>

### In a few minutes

<details>
<summary>Enhance auto-generated mocking code with business logic and state. A few small changes can transform your totally fake endpoint to a fully functional replica of the real one, or anything in between.</summary>

Video coming soon. For now see the [usage guide](./docs/usage.md).

</details>

<details>
<summary>Interact with the mock server's context via a REPL.</summary>

Video coming soon. For now see the [usage guide](./docs/usage.md).

</details>

<details>
<summary>Simulate real-world conditions, such as a user with an extra long email address, low inventory, HTTP error codes, or latency.</summary>

Video coming soon. For now see the [usage guide](./docs/usage.md).

</details>

<details>
<summary>Prototype and rapidly iterate on a REST APIs.</summary>

Video coming soon. For now see the [usage guide](./docs/usage.md).

</details>

More info under [Documentation](./docs/usage.md).

---

Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new). If you like what you see, please give this project a star!
