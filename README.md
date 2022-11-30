<div align="center" markdown="1">

# Counterfact is the mock server that front end engineers need to be productive

[Quick Start](./docs/quick-start.md) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

</div>

<br>

<div align="center"  markdown="1">

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main) ![MIT License](https://img.shields.io/badge/license-MIT-blue)

</div>

## Features

- Supports JavaScript and TypeScript
- Runs on Node, Deno, and Bun
- Uses Swagger / OpenAPI if you have it
- File system based routing
- Hot reload server-side code
- Manipulate test data with a REPL
- Toggle between the mock and real backend at runtime
- Works with any “front end” that calls RESTful services (a React app, a native iOS app, a web service, etc.)
- Emulates the real back end, but 100X faster

## Use Cases

- Rapidly iterate on the front end without waiting for back end features or changes
- Reproduce bugs when the conditions on the server side are hard to replicate
- Test against a private, local stack that you fully control
- Write contract tests for APIs

Unlike similar tools, Counterfact is not limited to canned or randomly generated responses. It can mimic as much or as little of the business logic in your n-tier / cloud-native back end as you want. Test end-to-end scenarios in your front end code as if a lighting-fast implementation of the real backend is running on your machine. Because it is.

As a front end dev, when you have **complete and granular control over the back end**, and you can **modify anything on a whim**, it **enhances your developer experience** in ways that are hard to describe.

## What does the code look like?

<details markdown="1">

<summary><code>GET /hello/world</code></summary>

```js
// ./paths/hello/world.js
export const GET = () => "Hello World!";
```

</details>

<details>

<summary markdown="1">Using the <a href="https://petstore3.swagger.io">Swagger Petstore</a> as an example, here’s one way to implement <code>GET /pet/{petId}`</code> and <code>POST `POST /pets`</code>.</summary>

```js
// ./paths/pet/{petId}.js
export const GET = ({ context, response, path }) => {
  const pet = context.getPetById(path.petId);

  if (!pet) {
    return response[404].text(`Pet with ID ${path.petID} not found.`);
  }

  return response[200].json(pet);
};
```

```js
// ./paths/pets.js
export const POST = ({ context, response, body }) => {
  const pet = context.addPet(body);

  return response[200].json(pet);
};
```

```js
// ./paths/$.context.js
class PetStore () {
    pets = {};

    getPetById(petId) {
        return pets[id];
    }

    addPet(pet) {
        this.pets[pet.id] = pet;
    }
}

export default new PetStore();
```

</details>

## If you have a Swagger / OpenAPI spec, you'll be up and running in seconds

For example, run the following command to generate code for the Swagger Petstore.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api --open
```

That command generates and starts a TypeScript implementation of the Swagger Petstore which returns random, valid responses. Not too shabby for _a few seconds of work_!

## It's your server. Do whatever you want with it.

Edit the code under `./api/paths` to **implement real behavior**, as we did in the JavaScript examples above. Store and retrieve data, perform calculations, filter / sort / paginate, whatever it takes the make the API real enough to support the development and testing of your front end.

- Use autocomplete as documentation. For example, when you're working on an operation that takes query parameters, type "`$.query.`" to list all of the available parameters.
- Stay in sync with changes in your OpenAPI / Swagger document. Counterfact will keep the type definitions up to date without overwriting your work.
- Get immediate feedback. Modules are hot reloaded so changes apply immediately without restarting the server or resetting its state.
- Interact with the running server using a REPL. For example, type `context.addPet({id: 2, name: "Fido"})` to add a pet to the store. Then view the pet you just added at `http://localhost:3100/pet/2`.
- Much more!

See the [Usage Guide](./docs/usage.md) for details.

---

Counterfact is brand new as of November 30, 2022. Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new). If you like what you see, please give this project a star!

```

```
