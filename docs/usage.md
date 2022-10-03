# Usage

Counterfact is two complimentary tools in one:

- a code generator that converts OpenAPI to TypeScript
- a fast and flexible "fake" server that's optimized for making changes quickly

## Hello <del>World</del> Pet Store 👋

The easiest way to start is to copy and paste this command in your terminal.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api --open
```

We're using the Swagger Pet Store example because it's well known and convenient. If you have your own OpenAPI 3 document handy, you can point to that instead. Nothing below depends on the pet store. You can also change `api` to wherever you'd like to output the code.

<details>

<summary>Here are the full details on CLI usage</summary>

```txt
Usage: counterfact [options] <openapi.yaml> [destination]

Counterfact is a tool for generating a REST API from an OpenAPI document.

Arguments:
openapi.yaml path or URL to OpenAPI document
destination path to generated code (default: ".")

Options:
--serve start the server after generating code
--port <number> server port number (default: 3100)
--swagger include swagger-ui (implies --serve)
--open open a browser to swagger-ui (implies --swagger and --serve)
-h, --help display help for command

```

</details>

## Generated Code 🏖

After using Counterfact to generate code you should have three directories:

- 📂 **components** contains the TypeScript types for the objects used in your REST API. These components correspond to the `/schema/components` section of the OpenAPI spec.
- 📂 **paths** contains the implementation of each endpoint. These are commonly referred to as "routes". Counterfact uses the word "paths" because it corresponds to the `/paths` section of the API spec.
- 📂 **path-types** contains the type information for paths.

The code under `components` and `path-types` is regenerated every time you run Counterfact, so that the types can stay in sync with any OpenAPI changes. The code under paths is scaffolding that you're meant to edit by hand. Counterfact will not overwrite your changes in the `paths` directory, but it will add new files when necessary.

> You don't have to use the code generator. It wasn't even part of Counterfact originally. The alternative is to create paths directory by hand works fine. The main benefit of generating code is all the type information that's managed for you.

## Reloading is so Hot Right Now 🔥

Changes you make will be picked up by the running server immediately. _There's no need to restart!_

That's one of the key goals of Counterfact. While developing and testing, we want to explore _counterfactuals_, such as

- What if I'm 8 clicks deep in my UI and _then_ the server responds with a 500 error?
- What if there are no upcoming appointments?
- What if there are 100 upcoming appointments and they're all on a holiday?

In such cases, we want to be sure the front end code responds appropriately. Getting a real server to return such responses on whim is usually time consuming and tedious, if it's possible at all. Counterfact is optimized to make bending the server's behavior to suit a test case as painless as possible, in both manual and automated tests.

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

- `.random()` returns random data, using examples and other metadata the OpenAPI document.
- `.header(name, value)` allows you to add a response header. It will only show up when a response header is expected and you haven't already provided it.
- `.match(contentType, content)` is used to return content which matches the content type. If the API is intended to serve one of multiple content types, depending on the client's `Accepts:` header, you can chain multiple `match()` calls.
- `.json(content)` is shorthand for `.match("application/json", content)`
- `.text(content)` is shorthand for `.match("text/plain", content)`
- `.html(content)` is shorthand for `.match("text/html", content)`

You can build a response by chaining one or more of these functions, e.g. `return $.response[200].header("x-coolness-level", 10).text("This is cool!")`.

> Your IDE can help you build a valid response via autocomplete. It can also help ensure you return a valid and complete response. For example, if you leave out a required header, the function won't type check. (That's particularly useful when the documented API changes. TypeScript will tell you where your code needs to be updated.)

### The request objects: `$.path`, `$.query`, `$.headers`, and `$.body`

Most of the time, the server's response depends on input from various parts of the request: the path, the query string, the headers, or the body. We can use them like so:

```ts
export const GET: HTTP_GET = ($) => {
    if ($.headers['x-token'] !== 'super-secret') {
       return $.response[401].text('unauthorized');
    }
    const content = `TODO: output the results for "${query.keyword}" in ${$.path.groupName} that have the following tags: ${$.body.tags.join(',')}.`.

    return $.response[200].text(content);
};

```

Note that each of these objects is typed so you can use autocomplete to identify the parameters. For example, if you type `$.query.` you'll be presented with a list of expected query string parameters.

The `$.path` parameters are identified by dynamic sections of the path, i.e. `/groups/{groupName}/user/{userId}.ts`.

### Working with state: the `$.context` object and `$context.ts`

There's one more parameter we need to explore, the `$.context` object. It stands in for microservices, databases, and other entities from which the real API gets its data. It looks something like this:

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

The `context` object is defined in `$context.js` in the same directory as the file that uses it. It's up to you to define the API for a context object. For example, your `$context.js` file might look like this.

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

You can define a new context at each level of the API if you like by rewriting the respective `$context.ts` files. Or you can leave the default implementations, which delegate to their parent directories.

> You can make the context objects do whatever you want, including things like writing to databases. But remember that Counterfact is meant for testing, so holding on to data between sessions is an anti-pattern. Keeping everything in memory also makes it fast.

## No Cap Recap 🧢

That's basically everything you need to know about Counterfact. Using convention over configuration and automatically generated types, it allows front-end developers to quickly build fake REST APIs for prototype and testing purposes.

- Given an OpenAPI document, you can generate working TypeScript code and start up a server in seconds.
- By default, the server returns random responses based on metadata in the OpenAPI document (e.g. it uses examples where provided).
- Each endpoint is represented by a TypeScript file where the path to the file corresponds to the path of the endpoint.
- You can change the implementation at any time by changing these files.
- You can and should commit the generated code to source control. Files you change will not be overwritten when you start the server again. (The _types_ will be updated if the OpenAPI document changes, but you shouldn't need to edit the type definitions by hand.)
- Put behavior in `$context.ts` files. These are created for you, but you should rewrite them to suit your needs. (At least update the root `$context.ts` file.)

## We're Just Getting Started 🐣

"Advanced" features are coming soon:

- Integrate Counterfact into your workflow (Express, Koa, Webpack Dev Server, etc.)
- Use a REPL to interact with the context objects while the server is running
- Use Counterfact in your automated tests
- Record API calls while testing the front and manually and reuse those calls in automated tests
- Use HAR files to recreate scenarios / bugs encountered by real users
- Migration scripts to seed the server with test data or get it into a particular state
- Toggle individual endpoints between fake and real APIs via a GUI

And yes, contributions are welcome! An easy way to start is by [creating a CONTRIBUTING.md file](https://github.com/pmcelhaney/counterfact/issues/110).
