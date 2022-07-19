# Counterfact Demo

This demo illustrates some of the basic features of Counterfact.

`index.js` starts a Koa server and loads Counterfact's middleware pointed to route definitions at `./routes`.

Under `./routes` you will find a few endpoints definitions:

`hello.js` defines `/hello/:name` and says hello to your friends.

`hello/kitty.js` defines `/hello/kitty`, overriding the behavior defined in `hello.js`.

`count.js` defines `/count` and reports how many times you've visited the other URLs.

`user.js` defines `/user` and sends back a decoded JWT. The token is read from the headers and decoded in the response body.

Try adding more routes. You should be able to see the updates without restarting the server.
