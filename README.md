# Counterfact

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main)

> This project is a work in progress. As of September 18, 2022, most of the plumbing is in place but the [APIs are still solidifying](https://github.com/pmcelhaney/counterfact/issues/204) and it's not quite ready for day-to-day use. See the [Version 1.0](https://github.com/pmcelhaney/counterfact/milestone/3) and [Future](https://github.com/pmcelhaney/counterfact/milestone/5) milestones.


## What is Counterfact?

Counterfact automatically builds a reference implementation of your [OpenAPI](https://www.openapis.org/) document. It uses metadata from the OpenAPI document to generate random, valid responses. 

## Okay, tools already exist that can do that. Why build another?

Counterfact generates **TypeScript** code that you can **edit** to replace the random responses with real implementations. 

## What do you mean "real" implementation?

That's up to you! You can build a fully functional back-end if you like. Connect to a MongoDB, call other APIs, etc. 

While it may be tempting to do so because it's so easy, we don't recommend using Counterfact for production. It's designed for building a **fake back end** so  you can **test your front end**. 

## What do you mean by "fake" implementation? 

For example, say you want to make sure the UI behaves properly if the server returns a `503 Service Unavailable` response to a particular endpoint. That can be quite a hassle when production code. With Counterfact, it's a matter of changing the `POST()` function in `./paths/path/to/endpoint.ts` to `return {status: 503}`. Run your test and then back out the change. It doesn't take much longer than it took you to read this paragraph. _This can all be done without restarting the server._

Say you want to implement just enough of `POST` and `GET` so that after the front end posts an item, it can get the same item. But you don't want to go to the trouble of building a database for testing. Counterfact has APIs that makes building a simple in-memory implementation easy. 

## You said TypeScript. Does it use the OpenAPI data to generate types? 

It sure does! 

## Can I use those types in my front end?

You sure can!

## What else does it do!

So much more! We've barely scratched the surface. Stay tuned for detailed documentation and screen casts. 




