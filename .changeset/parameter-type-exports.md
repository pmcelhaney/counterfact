---
"counterfact": minor
---

Added explicit parameter type exports for query parameters, path parameters, and headers. Operation types now export separate named types (e.g., `findPetsByStatus_Query`, `getPetById_Path`, `authenticate_Headers`) when parameters exist and use the operationId from your OpenAPI specification. These types can be imported and reused elsewhere in your code. The main operation types (HTTP_GET, HTTP_POST, etc.) remain unchanged for backward compatibility.

Example:

```typescript
import type {
  HTTP_GET,
  findPetsByStatus_Query,
} from "./types/paths/pet.types.ts";

// Use the query type elsewhere
function validateQuery(query: findPetsByStatus_Query) {
  // ...
}
```
