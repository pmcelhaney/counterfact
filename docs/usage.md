<div align="right">

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main) ![MIT License](https://img.shields.io/badge/license-MIT-blue)

</div>

# Usage

Counterfact is two complimentary tools in one:

- a code generator that converts [OpenAPI](https://support.smartbear.com/swaggerhub/docs/tutorials/openapi-3-tutorial.html) to [TypeScript](https://www.typescriptlang.org/)
- a fast and flexible mock server that's optimized around front end dev workflows

## Hello <del>World</del> Pet Store 👋

The easiest way to start is to copy and paste this command into your terminal.

```sh copy
npm i -g ts-node
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api --open
```

It will generate TypeScript code for the Swagger Pet Store, start a server, and `--open` a browser running Swagger UI. We're using the pet store example because it's well known and convenient. If you have your own OpenAPI document handy, you can point to that instead. You can also change `api` to wherever you'd like to output the code.

<details>

<summary>Here are the full details on CLI usage</summary>

```txt
Usage: counterfact [options] <openapi.yaml> [destination]

Counterfact is a tool for generating a REST API from an OpenAPI document.

Arguments:
  openapi.yaml          path or URL to OpenAPI document
  destination           path to generated code (default: ".")

Options:
  --port <number>       server port number (default: 3100)
  --swagger             include swagger-ui
  --open                open a browser
  --proxy-url <string>  proxy URL
  --prefix <string>     base path from which routes will be served (e.g. /api/v1)
  -h, --help            display help for command

```

</details>

## Generated Code 🏖

After generating code you should have three directories:

- 📂 **components** contains the TypeScript types for the objects used in your REST API. These components correspond to the `/schema/components` section of the [OpenAPI spec](https://swagger.io/specification/).
- 📂 **paths** contains the implementation of each endpoint, a.k.a. routes. Counterfact uses the word "paths" because it corresponds to the `/paths` section of the spec.
- 📂 **path-types** contains the type information for paths.

The code under `components` and `path-types` is regenerated every time you run Counterfact, so that the types can stay in sync with any OpenAPI changes. The code under paths is minimal boilerplate that you're meant to edit by hand. Counterfact will not overwrite your changes in the `paths` directory, but it will add new files when necessary.

> You don't have to use the code generator. It wasn't even part of Counterfact originally. You can also create the files under `paths` by hand. The main benefit of generating code is all the type information that's managed for you and kept in sync with OpenAPI.

## Routing is where it's at 🔀

In the `paths` directory, you should find TypeScript files with code like the following.

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
```

The file's path corresponds to the endpoint's URL. Each of the exported functions implements an HTTP request method (GET, POST, PUT, etc.). Each of these functions takes one argument -- `$` -- which is used to access request information, build a response, and interact with the server's state.

> If you're familiar with Express, `$` is sort of a combination of `req` and `res` with type safety and extra super powers.

### The `$.response` object

The `$.response` object is used to build a valid response for the URL and request method. It's designed to work with your IDE's autocomplete feature and help you build a valid response without consulting the docs. Try typing `$.response.` in your IDE. You should see a list of numbers corresponding to HTTP response codes (200, 404, etc). Select one and then type another `.`. At this point the IDE should present you with one or more of the following methods.

- `.random()` returns random data, using `examples` and other metadata from the OpenAPI document.
- `.header(name, value)` adds a response header. It will only show up when a response header is expected and you haven't already provided it.
- `.match(contentType, content)` is used to return content which matches the content type. If the API is intended to serve one of multiple content types, depending on the client's `Accepts:` header, you can chain multiple `match()` calls.
- `.json(content)` is shorthand for `.match("application/json", content)`
- `.text(content)` is shorthand for `.match("text/plain", content)`
- `.html(content)` is shorthand for `.match("text/html", content)`

You can build a response by chaining one or more of these functions, e.g.

```ts
return $.response[200].header("x-coolness-level", 10).text("This is cool!")`.
```

> Your IDE can help you build a valid response via autocomplete. It can also help ensure the response matches the requirements in the OpenAPI document. For example, if you leave out a required header, the function won't type check. (That's particularly useful when there are API changes. Update the OpenAPI document, regenerate the types, and let TypeScript tell you where to update the code.)

### Request parameters: `$.path`, `$.query`, `$.headers`, and `$.body`

Most of the time, the server's response depends on input from various parts of the request: the path, the query string, the headers, or the body. We can use them like so:

```ts
export const GET: HTTP_GET = ($) => {
    if ($.headers['x-token'] !== 'super-secret') {
       return $.response[401].text('unauthorized');
    }

    const content = `TODO: output the results for "${query.keyword}"`
      + `in ${$.path.groupName}`
      + `that have the following tags: ${$.body.tags.join(',')}.`.

    return $.response[200].text(content);
};

```

Note that each of these objects is typed so you can use autocomplete to identify the parameters. For example, if you type `$.query.` you'll be presented with a list of expected query string parameters.

The `$.path` parameters are identified by dynamic sections of the path, i.e. `/groups/{groupName}/user/{userId}.ts`.

<a id="context-object"></a>

### Working with state: the `$.context` object and `$.context.ts`

There's one more parameter we need to explore, the `$.context` object. It stands in for microservices, databases, and other entities with which the real API interacts. It looks something like this:

```ts copy
// pet.ts
export const POST: HTTP_POST = ($) => {
  return $.response.json($.context.addPet($.body));
};
```

```ts copy
// pet/{id}.ts
 export const GET: HTTP_GET ($) => {
    const pet = $.context.getPetById(body);
    if (pet === undefined) return response[404].text(`Pet ${$.path.id} not found.`);
    return response.json(context.getPetById($.body));
 };
```

The `context` object is defined in `$.context.ts` in the same directory as the file that uses it. It's up to you to define the API for a context object. For example, your `$.context.ts` file might look like this.

```ts
class PetStore {
  pets: Pet[] = [];

  addPet(pet: Pet) {
    const id = this.pets.length;
    this.pets.push({ ...pet, id });
    return this.getPetById(id);
  }

  getPetById(id: number) {
    return this.pets[id];
  }
}

export default new PetStore();
```

By default, each `$.context.ts` delegates to its parent directory, so you can define one context object in the root `$.context.ts` and use it everywhere.

> You can make the context objects do whatever you want, including things like writing to databases. But remember that Counterfact is meant for testing, so holding on to data between sessions is an anti-pattern. Keeping everything in memory also makes it fast.

## Reloading is So Hot Right Now 🔥

Changes you make will be picked up by the running server immediately. _There's no need to restart!_

Hot reloading supports one of Counterfact's key design goals. While developing and testing, we want to explore _counterfactuals_, such as

- What if I'm 8 clicks deep in my UI and _then_ the server responds with a 500 error?
- What if there are no upcoming appointments?
- What if there are 100 upcoming appointments and they're all on a holiday?
- What if run this report on a weekend?

In such cases, we want to be sure the front end code responds appropriately. Getting a real server to do what we need to test front end code is usually difficult if not impossible. Counterfact is optimized to make bending the server's behavior to suit a test case as painless as possible, in both manual and automated tests.

## REPL without a Pause ⏯

Another way to explore counterfactuals in real time is to interact with the running server via the read-eval-print loop (REPL), in the same way that you interact with running UI code in your browser's developer tools console. If you look in the terminal after starting Counterfact you should see a prompt like this:

```txt
____ ____ _  _ _ _ ___ ____ ____ ____ ____ ____ ___
|___ [__] |__| |\|  |  |=== |--< |--- |--| |___  |
       High code, low effort mock REST APIs

| API Base URL  ==> http://localhost:3100
| Admin Console ==> http://localhost:3100/counterfact/
| Instructions  ==> https://counterfact.dev/docs/usage.html

Starting REPL, type .help for more info


```

At the `🤖>` prompt, you can enter JavaScript code to interact with the live [context object](#context-object). For example, here's a quick way to add a pet to the store.

```js
context.addPet({ name: "Fluffy", photoUrls: [] });
```

Or add 100 pets:

```js
for (i = 0; i < 100; i++) context.addPet({ name: `Pet ${i}`, photoUrls: [] });
```

Or get a list of pets whose names start with "F"

```js
context.pets.find((pet) => pet.name.startsWith("F"));
```

Using the REPL is a lot faster (and more fun) than wrangling config files and SQL and whatever else it takes to get a real back end into the states you need to test your UI flows.

## Proxy Peek-a-boo 🫣

At some point you're going to want to test your code against a real server. Or maybe you want to use Counterfact for newer endpoints that don't exist in the real server yet and a real server for everything else. Counterfact has a couple of facilities that allow you to _proxy_ to the real server on a case-by-case basis.

To proxy an individual endpoint, you can use the `$.proxy()` function.

```ts copy
// pet/{id}.ts
 export const GET: HTTP_GET ($) => {
    return $.proxy("http://uat.petstore.example.com/pet")
 };
```

To toggle globally between Counterfact and a proxy server, pass `--proxy-url <url>` in he CLI.

Then type `.proxy on` / `.proxy off` in the REPL to turn it on and off. When the global proxy is on, all requests will be sent to the proxy URL instead of the mock implementations in Counterfact.

This feature is hot off the presses and somewhat experimental. We have plans to introduce more granular controls over what gets proxied when, but we want to see how this works first. Please send feedback!

## No Cap Recap 🧢

Using convention over configuration and automatically generated types, Counterfact allows front-end developers to quickly build fake REST APIs for prototype and testing purposes.

- Given an OpenAPI document, you can generate working TypeScript code and start up a server in seconds.
- By default, the server returns random responses based on metadata in the OpenAPI document (e.g. it uses examples where provided).
- Each endpoint is represented by a TypeScript file where the path to the file corresponds to the path of the endpoint.
- You can change the implementation at any time by changing these files.
- You can and should commit the generated code to source control. Files you change will not be overwritten when you start the server again. (The _types_ will be updated if the OpenAPI document changes, but you shouldn't need to edit the type definitions by hand.)
- Put behavior in `$.context.ts` files. These are created for you, but you should rewrite them to suit your needs. (At least update the root `$.context.ts` file.)
- Use the REPL to manipulate the server's state at runtime

## We're Just Getting Started 🐣

More features are coming soon:

- Integrate Counterfact into your workflow (Express, Koa, Webpack Dev Server, etc.)
- Use Counterfact in your automated tests
- Record API calls while testing the front end manually and reuse those calls in automated tests (ala [Playwright](https://playwright.dev/))
- Use [HAR](https://toolbox.googleapps.com/apps/har_analyzer/) files to recreate scenarios / bugs encountered by real users
- Migration scripts to seed the server with test data or get it into a particular state, ala [Playwright](https://playwright.dev/).
- Toggle between fake and real APIs, either the whole server or individual routes, at runtime, with a GUI

Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new).

And yes, [contributions](../CONTRIBUTING.md) are welcome!
