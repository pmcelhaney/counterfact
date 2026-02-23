---
"counterfact": major
---

BREAKING: Updates route types to use operationId for more explicit route types and operation types.
Why: Presently the routes generated from the OpenApi specification all use the same exported type of HTTP*{method} such as HTTP_GET and HTTP_POST. When you open those types, the path parameters, query parameters and headers are just inline types in the parent exported class. Some of our users desired the inline types to be explicit so that they can use the generated query types in other places. Our first change was just to add explicit types to the query parameters, but in working through the change it made more sense to go ahead and also add types for the path parameters and headers. Then since those new types will attempt to use the operationId from the spec if it is available, it made sense to make the entire route type more unique to that operationId instead of all the routes using HTTP_GET, HTTP_POST, HTTP_DELETE, etc.
What you need to do: On launch Counterfact will run a migration script to migrate all your existing routes to the new types. You will need to pay attention to the output after your first run to be sure the upgrade was correct. In the unlikely event that an end user has other places in their code where they directly reference the HTTP* types those will need to be manually updated.
