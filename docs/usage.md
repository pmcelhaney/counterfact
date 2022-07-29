# Usage

_Warning: Do not try this at home. Most of the code snippets below depend on features that have not been completed yet. See the "depends on" list at the top of each section for current status._

These features do not depend on TypeScript or the code generator. In order to get the most out of the code generator, you should first review this document to understand the basics.

## Hello World

[ Depends on #https://github.com/pmcelhaney/counterfact/issues/132 and https://github.com/pmcelhaney/counterfact/issues/128 ]

To get started, create a directory called `paths` and under that a file called `hello.js`.

```js
// paths/hello.js
export function GET() {
  return "Hello, world!\n";
}
```

Now start Counterfact (from the base directory, not `./paths`).

```console
npx counterfact start
```

Point a browser to http://localhost:3100/hello to confirm that the server is running. You should see a page with the text "Hello, world!"

Going forward, you might want to use a tool like Postman or SwaggerUI to test the API. Or you can open another terminal or and use `curl`. Here's what the input and output should look like.

```console
> curl http://localhost:3100/hello
Hello, world!
```

## Query string parameters

Change `hello.js` so that it reads a query string parameter in order to determine how many exclamation points to add.

```js
// paths/hello.js
export function GET(request) {
  const exclamationPoints = "!".repeat(request.query.excitementLevel);
  return `Hello, world${exclamationPoints}`;
}
```

```console
> curl http://localhost:3100/hello?excitementLevel=3
Hello, world!!!

> curl http://localhost:3100/hello?excitementLevel=10
Hello, world!!!!!!!!!!
```

## Destructuring the request object

We can refactor this code to make it a bit more readable by destructuring the `request` parameter.

```js
// paths/hello.js
export function GET({ query }) {
  //                  ^^^^^^^^^ the request parameter is destructured
  const exclamationPoints = "!".repeat(query.excitementLevel);
  //                                   ^ we can delete "request."
  return `Hello, world${exclamationPoints}`;
}
```

Destructuring allows us to pretend like JavaScript has named parameters. The reason for that will become clearer as we move through more complex examples.

## Paths

Create a directory under `./paths` called `hello`. Under that directory add files named `Alice.js` and `Bob.js`.

```js
// paths/hello/Alice.js
export function GET() {
  return `Hello, Alice!`;
}
```

```js
// paths/hello/Bob.js
export function GET() {
  return `Hello, Bob!`;
}
```

```console
> curl http://localhost:3100/hello/Alice
Hello, Alice!

> curl http://localhost:3100/hello/Bob
Hello, Bob!
```

## Path Parameters

It would be silly to create a separate file for each of our friends. Let's create a file for a generic `/hello/{name}` path instead.

```js
// paths/hello/{name}.js
export function GET({ path }) {
  return `Hello, ${path.name}!`;
}
```

```console
> curl http://localhost:3100/hello/Alice
Hello, Alice!

> curl http://localhost:3100/hello/Bob
Hello, Bob!

> curl http://localhost:3100/hello/Eve
Hello, Eve!
```

The word "hello" can also be parameterized if we rename the "hello" directory to `{greeting}`.

```js
// paths/{greeting}/{name}.js
export function GET({ path }) {
  return `${path.greeting}, ${path.name}!`;
}
```

```console
> curl http://localhost:3100/Hello/Alice
Hello, Alice!

> curl http://localhost:3100/Howdy/Bob
Howdy, Bob!

> curl http://localhost:3100/Yo/Eve
Yo, Eve!
```

## Path _and_ Query Parameters

Let's combine what we've learned so far.

```js
// paths/{greeting}/{name}.js
export function GET({ path, query }) {
  const exclamationPoints = "!".repeat(query.excitementLevel);
  return `${path.greeting}, ${path.name}${exclamationPoints}`;
}
```

```console
> curl http://localhost:3100/Hello/Alice?excitementLevel=1
Hello, Alice!

> curl http://localhost:3100/Howdy/Bob?excitementLevel=3
Howdy, Bob!!!

> curl http://localhost:3100/Yo/Eve?excitementLevel=20
Yo, Eve!!!!!!!!!!!!!!!!!!!!
```

## Response Headers

So far we've only looked the _body_ of the HTTP response. What about the other parts, like status code and headers?

```console
>  curl -v http://localhost:3100/hello
*   Trying 127.0.0.1:3100...
* Connected to localhost (127.0.0.1) port 3100 (#0)
> GET /hello HTTP/1.1
> Host: localhost:3100
> User-Agent: curl/7.79.1
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Content-Length: 14
< Date: Thu, 28 Jul 2022 14:44:35 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
<
Hello, world!
```

So far our `GET` function has always returned a string. In that case Counterfact assumes with intend to send a response with status code `200`, media type `text/plain` and the standard headers. We can be more specific by returning an object instead of a string.

```js
// paths/hello.js
export function GET() {
  return {
    status: 201,
    contentType: "application/json",

    headers: {
      "X-Custom-Header": "cool",
    },

    body: { message: "Hello, world!" },
  };
}
```

```console
❯ curl -v http://localhost:3100/hello
*   Trying 127.0.0.1:3100...
* Connected to localhost (127.0.0.1) port 3100 (#0)
> GET /hello HTTP/1.1
> Host: localhost:3100
> User-Agent: curl/7.79.1
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 201 Created  # <--------------- from status: 201
< Content-Type: application/json; charset=utf-8
< Content-Length: 27
< Date: Thu, 28 Jul 2022 15:02:17 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< X-Custom-Header: cool ## <-------------- from headers["X-Custom-Header"]
<
* Connection #0 to host localhost left intact
{"message":"Hello, world!"} ## <---------- from body
```

## A Slightly More Realistic Example

Enough with "hello world". Let's work our way toward something _useful_. The `/weather/{city}` endpoint returns the current temperature for a given city, or 404 if it doesn't recognize the city.

```js
// paths/{city}/weather.js
const temperatures = {
  chicago: 74,
  "new-york": 83,
  "san-francisco": 56,
};

function fahrenheitToCelsius(temperature) {
  return Math.round(((temperature - 32) * 5) / 9);
}


export function GET({ path, query }) {
  if (!(path.city in temperatures)) {
    return {
      status: 404,
      contentType: "text/plain"

      body: `No temperature found for ${city}.`,
    };
  }

  const f = temperatures[path.city];
  const c = fahrenheitToCelsius(f);

  const displayTemperature = query.unit === "C" ? `${c} C` : `${f} F`;

  return {
    status: 200,
    contentType: "application/json",

    headers: {
      "X-Unit": ${query.unit},
    },

    body: {
        city: path.city,
        temperature: displayTemperature
    },
  };
}
```

```console
❯ curl -v http://localhost:3100/chicago/weather?unit=C
*   Trying 127.0.0.1:3100...
* Connected to localhost (127.0.0.1) port 3100 (#0)
> GET /chicago/weather HTTP/1.1
> Host: localhost:3100
> User-Agent: curl/7.79.1
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Content-Length: 34
< Date: Thu, 28 Jul 2022 15:53:35 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< X-Unit: C
<
* Connection #0 to host localhost left intact
{
    "body": {
        "city": "chicago",
        "temperature": "23 C"
    }
}
```

```
❯ curl -v http://localhost:3100/austin/weather
*   Trying 127.0.0.1:3100...
* Connected to localhost (127.0.0.1) port 3100 (#0)
> GET /austin/weather HTTP/1.1
> Host: localhost:3100
> User-Agent: curl/7.79.1
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 404 Not Found
< Content-Type: text/plain; charset=utf-8
< Content-Length: 31
< Date: Thu, 28 Jul 2022 15:44:06 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* Connection #0 to host localhost left intact
No temperature found for austin.

```

## HTTP Verbs

At this point we've defined some hard-coded temperatures and use them in a mock GET request. This is the place where a lot mocking tools end. Counterfact is just getting started.

When we POST to /{city}/weather we want to store the temperature so that we can look it up later. To support that we will add a `POST()` function to the existing code.

```js
// paths/{city}/weather.js

/* ... existing code ... */

export function POST({ body }) {
  temperatures[body.city] = body.temperature;
}
```

`POST()` works exactly like `GET` except that in addition to `query` and `path` a `POST` request can have a `body`.

Let's try it out.

```
> curl -X POST -d '{ "temperature": 100 }' http://localhost:3100/atlanta/weather
> curl http://localhost:3100/atlanta/weather?unit=F
{
    "body": {
        "city": "atlanta",
        "temperature": "100 F"
    }
}
```

The other verbs (`PUT`, `PATCH`, `DELETE`) work the same way.

## Context

So far we've seen a simple way to store state in the server. We created a JavaScript object within a module and set / get its properties. In order to support more complex business logic, Counterfact can pass around a singleton object named `context` to all of the request methods.

We can refactor `weather.js` to use the context object.

```js
// paths/{city}/weather.js

export function GET({ path, query }) {

  if (!(context.hasTemperature(path.city))) {
    return {
      status: 404,
      contentType: "text/plain"

      body: `No temperature found for ${city}.`,
    };
  }


  return {
    status: 200,
    contentType: "application/json",

    headers: {
      "X-Unit": query.unit,
    },

    body: {
        city: path.city,
        temperature: context.getTemperature(path.city, query.unit)
    },
  };

}

export function POST({ body, context }) {
  context.setTemperature(path.city, body.temperature);
}
```

And define the context object by creating a file at `./context/context.js`

```js
function fahrenheitToCelsius(temperature) {
  return Math.round(((temperature - 32) * 5) / 9);
}

class Context {
  setTemperature(city, temperature) {
    this.temperatures[city] = temperature;
  }

  getTemperature(city, unit) {
    const f = this.temperatures[city];
    const c = fahrenheitToCelsius(f);

    return unit === "C" ? `${c} C` : `${f} F`;
  }

  hasTemperature(city) {
    return city in this.temperatures;
  }
}

export default new Context();
```

The `GET()` and `POST()` functions are now simplified. The business logic has been moved to the `Context` class which is easy to unit test.

## Multiple Content Types

Sometimes an endpoint can return a response body with one of multiple content types. Which one is sent depends on which ones the client reports in its `Accepts:` header.

```js
export function GET({ path, query }) {
  // 404 handler elided

  return {
    status: 200,

    headers: {
      "X-Unit": query.unit,
    },

    contentType: [
      [
        "application/json",
        {
          city: path.city,
          temperature: context.getTemperature(path.city, query.unit),
        },
      ],
      [
        "text/plain",
        `It is ${context.getTemperature(path.city, query.unit)} in ${
          path.city
        }.`,
      ],
    ],
  };
}
```

## Response Builder

[Depends on https://github.com/pmcelhaney/counterfact/issues/133, https://github.com/pmcelhaney/counterfact/issues/134, https://github.com/pmcelhaney/counterfact/issues/135 ]

The return value tends to be somewhat verbose and repetitive. As such, Counterfact provides a _response builder_ object called `response` to make the code a bit more tidy and readable. Let's update the `GET()` function to take advantage of `response`.

<!-- prettier-ignore -->
```js
// paths/{city}/weather.js

export function GET({ path, query, response }) {
  if (!context.hasTemperature(path.city)) {
    return response[404].match(
      "text/plain",
      `No temperature found for ${city}.`
    );
  }

  return response[200]
    .header("X-Unit", query.unit)
    .match("application/json", {
        city: path.city,
        temperature: context.getTemperature(path.city, query.unit),
    }).match("text/plain", `It is ${context.getTemperature(path.city, query.unit)} in ${path.city}.`);
}
```

The `response` parameter has enough tricks up its sleeve that it's worthy of a document unto itself. We will link that document here when it's written. For now here's a teaser.

```js
response[responseCode]
  .header("a-string-header", "value")
  .header("a-number--header", 100)
  .match("content/type", "body")
  .match("another/type", "body")
  .json({ isJson: true }) // shortcut for .match("application/json", ...)
  .text("text") // shortcut for .match("text/plain", ...)
  .html("<p>html</p>"); // shortcut for .match("text/html", ...)
  .random() // a random, valid value (depends on Counterfact having been initialized with an OpenAPI document)
```

The `response` API was carefully designed to take advantage of TypeScript and IDEs that provide intellisense. [ Creating a context-sensitive type is going to take some work, starting with https://github.com/pmcelhaney/counterfact/issues/136 ]

### Asynchronous Handlers

If you need to do work asynchronously, return a promise or use async / await.

```js
export function PUT({ body, response }) {
  return doSomeStuffWith(body).then(() =>
    response[202].text("Successfully did an async PUT")
  );
}

export async function DELETE() {
  await deleteMe();

  return response[200].text("Took a while but now it's deleted.");
}
```
