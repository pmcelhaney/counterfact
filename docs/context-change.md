# Context Switch

Version 0.36 has a minor breaking change in the way context objects are defined.

## The file is now named `_.context.ts` instead of `$.context.ts`.

This change was made because putting a `$` in a file name can be confusing in Mac/Linux/Unix systems.

## Instead of exporting a default _value_, it the file should now export a class named `Context`

### Old

```ts
class Context {
  // ...
}

export default new Context();
```

### New

```ts
export class Context {
  // ...
}
```

In the future, the context class will be able to have a constructor that takes one argument, an instance of the _parent_ context.

```ts
// paths/accounts/_context.ts
import { CounterfactContext } from "../../types.ts";

export class Context extends CounterfactContext {
  constructor(registry) {
    this.mainContext = registry.find("/");
    this.productsContext = registry.find("/products");
  }
  // ...
}
```
