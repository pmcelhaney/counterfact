# Counterfact

This is a work in progress.

If you're nosy and don't mind a whole lot of incompleteness:

```sh
yarn
yarn tsc
node dist/trial.js
```

Then open http://localhost:3000 and prepare to be underwhelmed.

The next step is to set up a walking skeleton that configures a simple server, runs Apollo, and tests that everything works end-to-end. After that, create another implementation of the server interface that uses the file system, create a test fixture, and add that to the walking skeleton.

Then I can start filling in the request and response objects so that we can look at the query string, headers, etc. and send back status codes and other headers (not just a body).

Then add a store object that maintains state in memory.

Then set up a system whereby we can populate the store by selecting one or more migration scripts, and a UI on top of that so we can easily get the system into some predetermined state for testing.

Then publish the npm package so we can start using it.

Then add a CI/CD pipeline.

Then improve the error handling / logging.

Then maybe a record mode that automatically generates migration scripts.
