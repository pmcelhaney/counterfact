# Counterfact

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main)

Counterfact is (will be) a tool that helps front end developers and back end developers collaborate by quickly building reference implementations of [OpenAPI](https://www.openapis.org/) specs.

Counterfact is **not** for **production**.

Counterfact is **great** for **testing the UI**, both manual and automated testing. UI testing can be quite tedious and brittle in part because the _arrange_ part of Arrange, Act, Assert -- getting the server into a particular state -- is often slow, unpredictable, and complex. Counterfact bypasses the accidental complexity associated with arranging a real server's state, making tests that isolate the UI fast, repeatable, and easy to maintain.

It accomplishes that without over-isolating. You can run a full scenario: log in, make changes, log in with a different user, and see the effects of those changes. The server you're testing against is a _real_ server from the UI's perspective: it implements business logic and maintains state. It's only not real in the sense that it doesn't have to support 10,000 concurrent users, protect real data, go through a deployment pipeline, or maintain 99.99% uptime.

Counterfact is **great** for **communication between front end and back end teams**. OpenAPI does an excellent job defining the inputs and outputs of a RESTful service, but it can't tell us how a server is supposed to behave. Counterfact fills that gap. The feedback cycle is orders of magnitude faster than making changes to a real, scalable back end and then seeing how those changes affect the UI/UX.

## Road to 1.0

This project is a work in progress. As of July 15, 2022, most of the plumbing is in place. This project will reach 1.0 when mutation test coverage is > 90% and:

The following command

```sh
npx counterfact init ./my-petstore https://petstore3.swagger.io/api/v3/openapi.yaml
```

creates or augments an npm package, and after changing to the directory

```sh
cd my-petstore
```

the following command

```
yarn start
```

opens a browser with Swagger-UI pointing to a server that implements the pet store API.

Not a mock server that returns canned or randomly generated responses, a [_real_ implementation](./demo-ts/), written in TypeScript.

Or at least, the _potential_ for a real implementation. Out of the box, it will return example or random responses. But the code is easy to edit so, e.g., we can change `PUT /pet` to store a `Pet` in memory / a database / a microservice / etc., and `GET /pet` to retrieve that same `Pet`.

We can see the effects of the code changes _without restarting the server_.

And then after running

```sh
npm run counterfact generate /path/to/copy/of/petstore/with/some/changes.yaml
```

it regenerates the code except for the files that we changed. Of the files we changed, the IDE (via TypeScript and ESLint) tells us if the code needs to be modified to conform to the updated spec.

_Again, without restarting the server._

## Beyond 1.0

The scenario above describes a zero-configuration happy path, adhering to the philosophy of convention over configuration.

The next phase is to add configuration options that define things like what port the server runs on, when generated files are overwritten, where those files live, whether to add `start` and `generate` scripts and what they should be named, whether to build a soup-to-nuts server or only make Express / Koa / Connect middleware available, etc. These configurations may be set in a `.counterfactrc.json` file, environment variables, and or command line options, whatever makes sense.

(By the way, generating code is optional. When this project started, that wasn't even part of the scope. If you don't have an OpenAPI spec, or don't want to use it, Counterfact is still an ergonomic platform on which to build quick and dirty prototypes of RESTful services in TypeScript or JavaScript.)

After that, more features that improve developer experience. For example, say you're demoing an iOS music player app and someone asks about edge cases. You'll be able answer questions immediately by going into a REPL and typing things like:

```ts
context.addABunchOfSongsToCatalog(1_000_000);

context.setAlbumTitle(
  123,
  "This Is is a Very Long Name That is Definitely Not Going to Fit in the Allotted Space and it has Emoji 🦧"
);

network.setLatency("1-5s");
```

## Installation

```sh
npm install --save-dev counterfact
```

or

```sh
yarn add -D counterfact
```

## Usage

See the [demo-ts](./demo-ts/README.md) directory for an example.

### Using the Koa plugin

(Currently this is the only way to run Counterfact. A stand-alone CLI is coming soon.)

```js
import { fileURLToPath } from "node:url";

import Koa from "koa";
import { counterfact } from "counterfact";

const PORT = 3100;

const app = new Koa();

const initialContext = {};

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("paths/", import.meta.url)),
  initialContext
);

app.use(koaMiddleware);

app.listen(PORT);
```

### Setting up paths

The first thing you need to do is create a directory where you will put your paths implementations.

```sh
mkdir paths
```

To mock an API at `/hello/world`, create a file called `./paths/hello/world.js`.

Inside that file, output a function that handles a GET request.

```js
export function GET() {
  return {
    status: 200, // optional HTTP status code (200 is the default)
    body: "hello world", // HTTP response body
  };
}
```

Now when you run your server and call "GET /hello/world" you should get a 200 response with "hello world" in the body.

### Reading the query string

The get function has one parameter, a context object that contains metadata about the request. We can use that to read a the query string from `/hello/world?greeting=Hi`

```js
export function GET(context) {
  return {
    body: "${context.query.greeting} world",
  };
}
```

In practice, tend to use destructuring syntax, which is the closest thing we have in JavaScript to named arguments.

```js
export function GET({ query }) {
  return {
    body: "${query.greeting} world",
  };
}
```

### Dynamic routes

Create another file called `./routes/hello/[name].js`. This file will match `/hello/universe`, `/hello/friends`, and `/hello/whatever-you-want-here`.

```js
export function GET({ greeting, path }) {
  return {
    body: "${query.greeting}, ${path.name}!",
  };
}
```

The `path` object is analogous to the `query` object, holding values in the dynamic parts of the path.

(Note that `/hello/world` is still handled by `/hello/world.js` -- static routes take precedence over dynamic ones.)

This feature was [inspired by Next.js](https://nextjs.org/docs/routing/dynamic-routes).

### State

State management is handled through a plain old JavaScript object called `context`, which is passed as the second argument to the `counterfact()` function (default value = `{}`). You can modify the context object however you like. Changes will persist from one request to another as long as the server is running.

There are no rules around how you manipulate the context. Yes, you read that right.

```js
export function GET({ greeting, path, context }) {
  context.visits ??= {};
  context.visits[path.name] ??= 0;
  context.visits[path.name] += 1;

  return {
    body: "${query.greeting}, ${path.name}!",
  };
}
```

### Request Methods

So far we've only covered `GET` requests. What about `POST`, `PUT`, `PATCH` and `DELETE`? All HTTP request methods are supported. It's a matter exporting functions with the corresponding names.

```js
  export function GET({ path, context }) {

    context.friends ??= {};
    context.friends[path.name] ??= {
      appearance: "lovely"
    };

    return {
      body: "Hello, ${path.name}. You look ${context.friends[name].appearance} today!"
    }
  }

  export function POST(path, context, body) {

    context.friends ??= {};
    context.friends[path.name] ??= {};
    context.friends[appearance] = body.appearance;

    return {
      body: {
        "Okay, I'll remember that ${path.name} is ${body.appearance}!"
      }
    }
  }
```

### Asynchronous Handlers

If you need to do work asynchronously, return a promise or use async / await.

```js
export function PUT({ body }) {
  return doSomeStuffWith(body).then(() => {
    body: "Successfully did an async PUT";
  });
}

export async function DELETE() {
  await deleteMe();
  return {
    body: "Took a while, but now it's deleted.",
  };
}
```

### Coming soon

Headers, content-type, etc. are not supported yet but coming soon. Hopefully by now you can guess what those APIs are going to look like.

---

## Development Setup

Looking to get involved? You can begin by cloning the project and using one of the following setup options.

### Installation (devcontainer)

> **BETA**: We are working through using a devcontainer for development. If you have [Docker](https://docker.com) on your machine and would like to give it a go and give us some feedback, please clone the repo, and then follow the instructions on the following page in place of the Installation instructions below.
>
> - [Quick start: Open an existing folder in a container.](https://code.visualstudio.com/docs/remote/containers#_quick-start-open-an-existing-folder-in-a-container)

### Installation (Original Method)

Installation will set up Git hooks and install all of the Node packages.

1. Make sure you have [Node 16](https://nodejs.org/en/) installed.
2. Install yarn by running `npm install -g yarn`.
3. Install the dependencies by running `yarn install`.
