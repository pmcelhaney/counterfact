# Generated Code FAQ

## Am I meant to edit the generated code?

Yes, you're meant to edit the _imperative_ code under the `paths` directory in order to customize your mock server's behavior. Don't touch the _types_ under `path-types` and `components`. If you do, Counterfact will overwrite your changes anyway.

## Should I commit generated code to source control?

Short answer: yes, commit everything.

Use your Git client to add and commit the directory containing Counterfact's output. It's best not get bogged down in the details. But if you really want to know, here are the details.

You absolutely _should_ put the files under the `paths` directory under version control. That's _your_ code. Counterfact generates starter files and after that doesn't touch the code again.

In theory, code under `path-types` and `components` can be reproduced exactly given the same input (OpenAPI file), so it might make sense to put those directories in your `.gitignore`. However, that depends on whether the OpenAPI file is in the same repository. That's not always the case, especially if the API is owned by a different team -- or a different organization.

Note that Counterfact creates `.gitignore` file that excludes the `.cache` directory. Do commit `.gitignore`, don't commit `.cache`.

## What's with these `never` types?

If you peek into the type definitions under `path-types` you may notice a bunch of references to `never`. For example, you might see `query: never`.

The upshot is you won't see `query` offered as an autocomplete when you type `$.` when you're writing code for that operation. And if you have code like `$.query.id`, TypeScript will yell at you.

This is by design. The code is generated from an OpenAPI description. If the OpenAPI description doesn't specify any query parameters, Counterfact assumes there's no reason to look for query parameters in the URL. If the OpenAPI description is incomplete, it's better to fix it at the source.

## When do I need to restart?

If your OpenAPI file is local, Counterfact will watch the file and automatically regenerate types whenever it changes.

If you point to a URL like https://petstore3.swagger.io/api/v3/openapi.yaml, Counterfact only looks up the URL once at startup. So you would need to restart to pick up any changes.

If you have control over the OpenAPI (i.e. you're not getting it from a third party), we recommend working with a local file for a great developer experience.

## After reading this FAQ and now I have even more questions!

Please reach out by [creating an issue](https://github.com/pmcelhaney/counterfact/issues).
