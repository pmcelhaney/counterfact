# Counterfact

[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main)

## Why?

I was building an UI against back end code that was so cumbersome I spent almost as much time trying to get the latest version of the back end code running as I did writing the front end code. Also I needed to build UI code against features and bug fixes that would not be available for a long time. Eventually I determined in the long run it would be quicker to hack together a fake implementation of the API so that I could keep going. Over time that fake implementation evolved to the point that it was pretty nice to work with. And I loved that I could easily recreate the exact scenarios I needed to test against.

After leaving that job and leaving the code behind, I looked around for open source tools that do more or less the same thing, and couldn't find any that were as malleable and flexible as the code that I had hacked together. So I recreated it as an open source library. Not hacked together this time, but carefully constructed with test driven development.

With Counterfact, we can implement a server with quick-and-dirty JavaScript code and _that's totally okay_. We're not supposed to use Counterfact in production any more than we're supposed to build a skyscraper out of Play-Doh. The design is optimized for testing scenarios quickly and painlessly. Changes are picked up immediately, without compiling or restarting the server. It's great for manual testing, especially hard to reproduce bugs. It's also great for automated testing.

## Installation

```sh
npm install --save-dev counterfact
```

or

```sh
yarn add -D counterfact
```

## Usage

See the [demo](./demo/README.md) directory for an example.

### Using the Koa plugin

(Currently this is the only way to run Counterfact. A stand-alone CLI is coming soon.)

```js
import { fileURLToPath } from "node:url";

import Koa from "koa";
import { counterfact } from "counterfact";

const PORT = 3100;

const app = new Koa();

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("routes/", import.meta.url))
);

app.use(koaMiddleware);

app.listen(PORT);
```

### Setting up routes

The first thing you need to do is create a directory where you will put your routes.

```sh
mkdir routes
```

To mock an API at `/hello/world`, create a file called `./routes/hello/world.js`.

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

State management is handled through a plain old JavaScript object called `store`. The store is initialized as an empty object (`{}`). You can read and write its keys however you like. Changes will persist from one request to another as long as the server is running.

There are no rules around how you manipulate the store. Yes, you read that right.

```js
export function GET({ greeting, path, store }) {
  store.visits ??= {};
  store.visits[path.name] ??= 0;
  store.visits[path.name] += 1;

  return {
    body: "${query.greeting}, ${path.name}!",
  };
}
```

### Request Methods

So far we've only covered `GET` requests. What about `POST`, `PUT`, `PATCH` and `DELETE`? All HTTP request methods are supported. It's a matter exporting functions with the corresponding names.

```js
  export function GET({ path, store }) {

    store.friends ??= {};
    store.friends[path.name] ??= {
      appearance: "lovely"
    };

    return {
      body: "Hello, ${path.name}. You look ${store.friends[name].appearance} today!"
    }
  }

  export function POST(path, store, body) {

    store.friends ??= {};
    store.friends[path.name] ??= {};
    store.friends[appearance] = body.appearance;

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
