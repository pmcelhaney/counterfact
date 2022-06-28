# Counterfact Demo - TypeScript

This demo illustrates some of the basic features of Counterfact, with TypeScript.

It requires ts-node (`npm i -g ts-node`).

Start it by running `ts-node-esm index.ts`.

`index.ts` starts a Koa server and loads Counterfact's middleware pointed to route definitions at `./routes`.

Under `./routes` you will find a few endpoints definitions:

`hello.ts` defines `/hello/:name` and says hello to your friends.

`hello/kitty.ts` defines `/hello/kitty`, overriding the behavior defined in `hello.ts`.

`count.ts` defines `/count` and reports how many times you've visited the other URLs.

Try adding more routes. You should be able to see the updates without restarting the server.
