# Generating Code

OpenAPI (formerly Swagger) is standard for documenting REST APIs. Given an OpenAPI description, Counterfact generates TypeScript code to implement the API.

## 📂 components

The components folder contains type definitions based on objects in the [components object](https://swagger.io/specification/#components-object) in the OpenAPI description.

For example, here's the definition of an Order in the Swagger petstore.

```yaml
Order:
  type: "object"
  properties:
    id:
      type: "integer"
      format: "int64"
    petId:
      type: "integer"
      format: "int64"
    quantity:
      type: "integer"
      format: "int32"
    shipDate:
      type: "string"
      format: "date-time"
    status:
      type: "string"
      description: "Order Status"
      enum:
        - "placed"
        - "approved"
        - "delivered"
    complete:
      type: "boolean"
  xml:
    name: "Order"
```

From this definition, Counterfact will generate `components/Order.ts`

```ts
export type Order = {
  id?: number;
  petId?: number;
  quantity?: number;
  shipDate?: string;
  status?: "placed" | "approved" | "delivered";
  complete?: boolean;
};
```

Counterfact uses these types internally. You can also use them in client-side code if you like.

You should not change these files by hand; Counterfact will regenerate the files when the spec changes.

## 📂 paths

The paths folder contains files corresponding to the paths in the API spec. For example, the implementation for the path `/order/{orderId}` is output to `./order/{orderId}.ts`.

```ts
import type { HTTP_GET } from "../../../path-types/store/order/{orderId}.types.js";
import type { HTTP_DELETE } from "../../../path-types/store/order/{orderId}.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};

export const DELETE: HTTP_DELETE = () => {
  /* no response content specified in the OpenAPI document */
};
```

Per the OpenAPI description, the `/order/{orderId}` path implements two HTTP request methods, GET and DELETE. Counterfact exports two corresponding functions named GET and DELETE. The default implementation of the GET function returns response with status code 200 and a randomly generated body that conforms to the specifications. Because the description says nothing about the response for a DELETE request, Counterfact doesn't return anything.

To change the way the server behaves, you will edit files in the `paths` directory. Counterfact won't ovewrite your changes. For more information, see [Configuring the Server's Responses](responses.md).

## 📂 path-types

The path-types folder contains type information needed by corresponding files in the paths directory. These files are not meant to be read or modified directly. Counterfact will update them when the OpenAPI spec changes.

## 📂 .cache

When the Counterfact server runs, it has to compile TypeScript files to JavaScript so that Node can run them. Those JavaScript files are stored in the `.cache` directory.
