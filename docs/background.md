# Background: Why Everyone Should Use Counterfact

> You wanted a banana but what you got was a gorilla holding the banana and the entire jungle. - Joe Armstrong, creator of Erlang

Once upon a time a developer was frustrated. He needed to fix a bug in some Angular code. In order to do that he needed to build and run the code locally on his machine. In order to run the Angular code he needed the back end code. So he needed to install .NET and Visual Studio, and SQL Server, and so on. When he finally got the back end application compiled and running, he found out he needed to connect to another back end service. Which required VPN access, opening a ticket, etc.

In a perfect world, setting up the back end have taken less than an hour. But that's not a world in which most of us live. And even in a perfect world, there are many cases where we need to test how the front end code will behave in scenarios that are difficult if not impossible to recreate on demand, such as a token expiring or adding an item to the cart 30 seconds before a sale ends.

Counterfact is a tool for building mock implementations of REST APIs. It allows front end developers to build and test code independently of the back end.

Counterfact is optimized for:

1. **Speed:** Because the server is running locally and not reading from a disk or performing complex computations, it's able to respond instantly. So you can test changes to front-end code without flow-busting lag.
2. **Flexibility:** Out of the box, the server returns random data matching your OpenAPI spec. Those responses can be customized. You can set it up to return a canned response or build business logic that reads the request using TypeScript. The server can even be stateful, storing information in one request and reading it in subsequent requests.
