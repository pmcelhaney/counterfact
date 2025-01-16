# Usage

Counterfact is three complimentary tools in one:

- a code generator that converts [OpenAPI](https://support.smartbear.com/swaggerhub/docs/tutorials/openapi-3-tutorial.html) to [TypeScript](https://www.typescriptlang.org/)
- a fast and flexible mock server that's optimized around front end dev workflows
- a JavaScript REPL for accessing the server's internal state at runtime

## Hello <del>World</del> Pet Store 👋

The easiest way to start is to copy and paste this command into your terminal.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

This command will generate TypeScript code for the Swagger Pet Store and start the server. We're using the pet store example because it's well known and convenient. If you have your own OpenAPI document handy, you can point to that instead. You can also change `api` to wherever you'd like to output the code.

> [!NOTE]
>
> <details>
>
> <summary>Here are the full details on CLI usage</summary>
>
> ```txt
> Usage: counterfact [options] [openapi.yaml] [destination]
>
> Counterfact is a tool for mocking REST APIs in development. See https://counterfact.dev for more info.
>
> Arguments:
>   openapi.yaml          path or URL to OpenAPI document or "_" to run without OpenAPI (default: "_")
>   destination           path to generated code (default: ".")
>
> Options:
>   --port <number>       server port number (default: 3100)
>   -o, --open            open a browser
>   -g, --generate        generate all code for both routes and types
>   --generate-types      generate types
>   --generate-routes     generate routes
>   -w, --watch           generate + watch all code for changes
>   --watch-types         generate + watch types for changes
>   --watch-routes        generate + watch routes for changes
>   -s, --serve           start the mock server
>   -r, --repl            start the REPL
>   --proxy-url <string>  proxy URL
>   --prefix <string>     base path from which routes will be served (e.g. /api/v1)
>   -h, --help            display help for command
> ```
>
> </details>

> [!TIP]
>
> <details>
> <summary>Using with npm or yarn</summary>
>
> If you prefer not to use `npx` against the `@latest` version, you can install Counterfact as a dependency with a specific version in npm or yarn. The following example adds a start script to your `package.json` file and adds Counterfact as a dev dependency.
>
> ```json
> "scripts": {
>   "start": "npx counterfact https://petstore3.swagger.io/api/v3/openapi.json api"
> },
> "devDependencies": {
>   "counterfact": "^0.38.3",
> }
> ```
>
> This will let your team use the same version of > Counterfact across all environments. You can also use `npm run start` or `yarn start` to start the server.
>
> </details>

## Generated Code 🏖

Code is automatically generated and kept in sync with your OpenAPI (aka Swagger) document, assuming you have one. Otherwise, see how to [use Counterfact without generating code](./usage-without-openapi.md).

The code goes into two directories:

- 📂 **types** contains the type information that is automatically regenerated when the OpenAPI document changes.
- 📂 **routes** contains the implementation of each path. Out of the box it creates minimal scaffolding which returns a random response for each request. A type-safe fluent API makes customizing the responses easier than editing a configuration file. However, you're not limited to random / canned data or rigid switch / case statements -- the full power of TypeScript / JavaScript is at your disposal.

See [Generated Code FAQ](./faq-generated-code.md) for details.

## Routing is where it's at 🔀

In the `routes` directory, you should find a TypeScript file corresponding to each of the paths in your OpenAPI file. For example "/users/{userid}" will create `./routes/users/{userid}.ts`. (If you have a path for the root, "/", it will map to `./routes/index.ts`.) The contents of each file will look something like this:

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
```

Each of the exported functions implements an HTTP request method (GET, POST, PUT, etc.). Each of these functions takes one argument -- `$` -- which is used to access request information, build a response, and interact with the server's state.

> [!TIP]
> If you're familiar with Express, `$` is sort of a combination of `req` and `res` with type safety and extra super powers.

### The `$.response` object

The `$.response` object is used to build a valid response for the URL and request method. **This object is designed to work with your IDE's autocomplete feature and help you build a valid response without consulting the docs.** Try typing `$.response.` in your IDE. You should see a list of numbers corresponding to HTTP response codes (200, 404, etc). Select one and then type another `.`. At this point the IDE should present you with one or more of the following methods.

- `.random()` returns random data, using `examples` and other metadata from the OpenAPI document.
- `.header(name, value)` adds a response header. It will only show up when a response header is expected and you haven't already provided it.
- `.match(contentType, content)` is used to return content which matches the content type. If the API is intended to serve one of multiple content types, depending on the client's `Accepts:` header, you can chain multiple `match()` calls.
- `.json(content)`, `.text(content)`, `.html(content)`, and `.xml(content)` are shorthands for the `match()` function, e.g. `.text(content)` is shorthand for `.match("text/plain", content)`.
  - if the content type is XML, you can pass a JSON object, and Counterfact will automatically convert it to XML for you
  - The `.json()` shortcut handles both JSON and XML.

To build a response, chain one or more of these functions, e.g.

```ts
return $.response[200].header("x-coolness-level", 10).text("This is cool!")`.
```

> [!TIP]
> Your IDE can help you build a valid response via autocomplete. It can also help ensure the response matches the requirements in the OpenAPI document. For example, if you leave out a required header, the function won't type check. (That's particularly useful when there are API changes. When you update the OpenAPI document, the types are automatically regenerated, and TypeScript tells you if the implementation needs to be updated.)

### Request parameters

Most of the time, the server's response depends on input from various parts of the request, which are accessible through `$.path`, `$.query`, `$.headers`, and `$.body`. The best way to explain is with an example:

```ts
export const GET: HTTP_GET = ($) => {
    if ($.headers['x-token'] !== 'super-secret') {
       return $.response[401].text('unauthorized');
    }

    const content = `TODO: output the results for "${$.query.keyword}"`
      + `in ${$.path.groupName}`
      + `that have the following tags: ${$.body.tags.join(',')}.`.

    return $.response[200].text(content);
};

```

Each of these objects is typed so you can use autocomplete to identify parameters names and types. For example, if you type `$.query.` you'll be presented with a list of expected query string parameters.

> [!NOTE]
> The `$.path` parameters are identified by dynamic sections of the file path, i.e. `/groups/{groupName}/user/{userId}.ts`.

<a id="context-object"></a>

### Working with state: the `$.context` object and `_.context.ts`

The `$.context` object contains in-memory state and business logic, allowing you to imitate to whatever degree is necessary the behavior of a real API. It looks something like this:

```ts copy
// pet.ts
export const POST: HTTP_POST = ($) => {
  return $.response[200].json($.context.addPet($.body));
};
```

```ts copy
// pet/{id}.ts
 export const GET: HTTP_GET ($) => {
    const pet = $.context.getPetById($.path.id);
    if (pet === undefined) return $.response[404].text(`Pet ${$.path.id} not found.`);
    return $.response[200].json(pet);
 };
```

The `context` object is an instance of a class exported from `./routes/_.context.ts`. Customize the class to suit your needs. For example, if we're implementing the Swagger Petstore, our `_.context.ts` file might look like this.

```ts
export class Context {
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
```

> [!IMPORTANT]
> You can make the context objects do whatever you want, including things like writing to databases. But remember that Counterfact is meant for testing; it's better to "forget" and return to a known state every time you start the server. Keeping everything in memory also makes the server lightning fast.

> [!TIP]
> An object with loadContext() function is passed to the constructor of a context class. You can use it load the context from another directory at runtime. This is an advanced use case.
>
> ```ts
> class Context {
>   constructor({ loadContext }) {
>     this.rootContext = loadContext("/");
>   }
> }
> ```

### Security: the `$.auth` object

If a username and password are sent via basic authentication, they can be found via `$.auth.username` and `$.auth.password` respectively.

Support for other security schemes ("apiKey", "mutualTLS", "oauth2", "openIdConnect") are coming. You can speed things along by [opening an issue](https://github.com/pmcelhaney/counterfact/issues).

### x-scape Hatch

Counterfact does a good job translating an OpenAPI description into TypeScript types. But if your documentation is incorrect or incomplete, or you want to try something that's not documented yet, the type safety can get in your way.

To work around that problem, Counterfact provides a "loose" types mode in the form of the `$.x` object. The `$.x` object is an alias of `$` in which all of the types are wider.

The best way to explain is with a couple of examples.

```ts
export function GET($): HTTP_GET {
  // There are no headers specified in OpenAPI
  $.headers["my-undocumented-header"]; // TypeScript error
  $.x.headers["my-undocumented-header"]; // ok

  // There is no 500 response type specified in OpenAPI
  return $.response[500].text("Error!"); // TypeScript error
  return $.x.response[500].text("Error!"); // ok
}
```

## Reloading is So Hot Right Now 🔥

When you save any file changes will be picked up by the running server immediately. _There's no need to restart!_

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

⬣>
```

At the `⬣>` prompt, you can enter JavaScript code to interact with the live [context object](#context-object). For example, here's a quick way to add a pet to the store.

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

> [!TIP]
>
> For large / complex APIs, a single context object may not be sufficient.
> Any subdirectory can provide its own context object by including a `_.context.ts` file that exports a class called `Context`.
> In the REPL, to access context object outside of the root, use `loadContext("/path/to/subdirectory")`.
>
> ```
> ⬣> const petsContext = loadContext("/pets");
> ```
>
> The `loadContext()` function is also passed to the constructor of `Context` so that one context object can access another.
>
> ```ts
> // ./routes/users/_.context.ts
> export class Context() {
>  constructor({ loadContext }) {
>    this.rootContext = loadContext("/");
>    this.petsContext = loadContext("/pets");
> }
> ```

## Proxy Peek-a-boo 🫣

At some point you're going to want to test your code against a real server. At that point, you could throw the mock server away. However, you may wish you's kept it around testing edge cases and back-end changes that are still in development.

_Why not both?_ 🤷‍♀️

Counterfact has a couple of facilities _proxy_ to the real server for the most part, but continue using mocks on a case-by-case basis.

To proxy an individual endpoint, you can use the `$.proxy()` function.

```ts copy
// pet/{id}.ts
 export const GET: HTTP_GET ($) => {
    return $.proxy("http://uat.petstore.example.com/pet")
 };
```

To set up a proxy for the entire API, add `--proxy <url>` in the CLI and / or type `.proxy url <url>` in the CLI.

From there, you can switch back and forth between the proxy and mocks by typing `.proxy [on|off] <path-prefix>`. Type `.proxy help` for detailed information on using the `.proxy` command.

Even if you're not using mocks at all, the proxy feature is convenient for switching between different back end environments -- local, dev, QA, etc -- without changing configuration files or restarting.

## No Cap Recap 🧢

With convention over configuration, automatically generated types, a fluent API, and an innovative REPL, Counterfact allows front-end developers to quickly build fake REST APIs for prototype and testing purposes.

- Given an OpenAPI document, you can generate working TypeScript code and start up a server in seconds. (Or you can skip that step and write terse JavaScript code by hand.)
- By default, the generated code returns random responses based on metadata in the OpenAPI document (e.g. it uses examples where provided).
- Each endpoint is represented by a TypeScript / JavaScript file where the path to the file corresponds to the path of the endpoint.
- You can change the implementation at any time by changing these files.
- You can and should commit the generated code to source control. Files you change will not be overwritten when you start the server again. (The _types_ will be updated if the OpenAPI document changes, but you shouldn't need to edit the type definitions by hand.)
- Put behavior in `_.context.ts` files. These are created for you, but you should modify them to suit your needs.
- Use the REPL to manipulate the server's state at runtime.

## We're Just Getting Started 🐣

More features are coming soon:

- Integrate Counterfact into your workflow (Express, Koa, Webpack Dev Server, etc.).
- Use Counterfact in your automated tests.
- Record API calls while testing the front end manually and reuse those calls in automated tests (à la [Playwright](https://playwright.dev/))
- Use [HAR](https://toolbox.googleapps.com/apps/har_analyzer/) files to recreate scenarios / bugs encountered by real users.
- Migration scripts to seed the server with test data or get it into a particular state, à la [Playwright](https://playwright.dev/).
- A management console that doubles as a modern alternative to Swagger UI.

Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new).

And yes, [contributions](../CONTRIBUTING.md) are welcome!
