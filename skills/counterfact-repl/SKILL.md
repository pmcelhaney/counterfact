---
name: counterfact-repl
description: >
  Interact with Counterfact mock API server programmatically.
  Inspect and modify context state, configure proxy settings,
  test endpoints, and control mock behavior. Use when the user
  mentions "counterfact", "mock server", "REPL", testing APIs,
  or working with OpenAPI mocks.
applyTo:
  - "**/*.{yaml,yml,json}"
  - "**/routes/**/*.{ts,js}"
  - "**/*context.{ts,js}"
---

# Counterfact REPL Skill

## Purpose

This skill enables AI agents to interact with a running Counterfact mock server through its Admin API. Counterfact provides programmable API mocks based on OpenAPI specifications, with a REPL for runtime manipulation. This skill exposes those capabilities programmatically via HTTP endpoints.

## What is Counterfact?

Counterfact is a contract-driven mock API server that:

- Generates mock endpoints from OpenAPI specifications
- Provides a JavaScript REPL for runtime state manipulation
- Allows programmable behavior (not just static responses)
- Supports context objects for storing mock state
- Enables proxy mode to route requests to real APIs selectively

The REPL lets developers manipulate mock state in real-time using JavaScript. This skill exposes the same capabilities via HTTP API.

## When to Use This Skill

Invoke this skill when the user:

- Mentions "counterfact", "mock server", "REPL", or "OpenAPI"
- Wants to test or develop against a mock API
- Needs to inspect or modify mock server state
- Wants to configure proxy vs. mock routing
- Needs to simulate API failures or edge cases
- Says things like:
  - "Add data to the mock"
  - "Change the mock state"
  - "Make the API return an error"
  - "Proxy this endpoint to the real server"
  - "What data is in the mock store?"
  - "Simulate a service failure"

## Detecting Counterfact

To determine if Counterfact is running, check in this order:

1. **Check for health endpoint** (most reliable):

   ```http
   GET http://localhost:3100/_counterfact/api/health
   ```

   If successful, Counterfact is running on port 3100.

2. **Look for package.json**:
   - Check if `counterfact` is in dependencies or devDependencies
   - Read scripts to find the port (e.g., `--port 3000`)

3. **Check for routes directory**:
   - Look for `routes/` or `api/routes/` directory
   - TypeScript/JavaScript files matching OpenAPI paths

4. **Check for OpenAPI spec**:
   - Files matching `*.yaml`, `openapi.yaml`, `swagger.yaml`
   - Look for `openapi:` or `swagger:` in content

5. **Try alternate ports**:
   - Port 3100 (default)
   - Port 3000 (common alternative)
   - Check environment variables or config files

## Admin API Endpoints

All Admin API endpoints are prefixed with `/_counterfact/api/`

### Health Check

**Request:**

```http
GET /_counterfact/api/health
```

**Response:**

```json
{
  "status": "ok",
  "port": 3100,
  "uptime": 123.45,
  "basePath": "/path/to/routes",
  "routePrefix": ""
}
```

**Use when:** Checking if server is running, getting server info.

---

### List All Contexts

**Request:**

```http
GET /_counterfact/api/contexts
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paths": ["/", "/pets", "/users"],
    "contexts": {
      "/": { "rootProperty": "value" },
      "/pets": { "pets": [...] },
      "/users": { "users": [...] }
    }
  }
}
```

**Use when:** Discovering what contexts exist, getting overview of all state.

---

### Get Specific Context

**Request:**

```http
GET /_counterfact/api/contexts/{path}
```

Example:

```http
GET /_counterfact/api/contexts/pets
```

**Response:**

```json
{
  "success": true,
  "data": {
    "path": "/pets",
    "context": {
      "pets": [
        { "id": 1, "name": "Fido" },
        { "id": 2, "name": "Whiskers" }
      ]
    }
  }
}
```

**Use when:** Inspecting state for a specific API path.

---

### Update Context

**Request:**

```http
POST /_counterfact/api/contexts/{path}
Content-Type: application/json

{
  "property": "newValue",
  "arrayProperty": [...]
}
```

Example:

```http
POST /_counterfact/api/contexts/pets
Content-Type: application/json

{
  "pets": [
    { "id": 1, "name": "Fido" },
    { "id": 2, "name": "Whiskers" },
    { "id": 3, "name": "Rex" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Context updated for path: /pets",
  "data": {
    "path": "/pets",
    "context": { "pets": [...] }
  }
}
```

**Use when:** Adding data, modifying state, simulating conditions.

**Important:** The update uses smart diffing - only changed properties are updated, preserving methods and other properties.

---

### Get Full Configuration

**Request:**

```http
GET /_counterfact/api/config
```

**Response:**

```json
{
  "success": true,
  "data": {
    "alwaysFakeOptionals": false,
    "basePath": "/path/to/routes",
    "buildCache": false,
    "generate": { "routes": true, "types": true },
    "openApiPath": "/path/to/openapi.yaml",
    "port": 3100,
    "proxyUrl": "",
    "routePrefix": "",
    "startRepl": true,
    "startServer": true,
    "watch": { "routes": true, "types": true },
    "proxyPaths": []
  }
}
```

**Use when:** Getting full server configuration.

---

### Get Proxy Configuration

**Request:**

```http
GET /_counterfact/api/config/proxy
```

**Response:**

```json
{
  "success": true,
  "data": {
    "proxyUrl": "https://api.example.com",
    "proxyPaths": [
      ["/api/users", true],
      ["/api/posts", false]
    ]
  }
}
```

**Use when:** Checking what paths are proxied vs. mocked.

---

### Update Proxy Configuration

**Request:**

```http
PATCH /_counterfact/api/config/proxy
Content-Type: application/json

{
  "proxyUrl": "https://api.example.com",
  "proxyPaths": [
    ["/api/users", true],
    ["/api/posts", false]
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Proxy configuration updated",
  "data": {
    "proxyUrl": "https://api.example.com",
    "proxyPaths": [
      ["/api/users", true],
      ["/api/posts", false]
    ]
  }
}
```

**Use when:** Switching between mock and real API, testing integration.

**Notes:**

- `proxyUrl` is the base URL to proxy to
- `proxyPaths` is an array of `[path, enabled]` tuples
- Path of `""` or `"/"` enables proxy globally
- Setting path `true` routes to real API, `false` uses mock

---

### List All Routes

**Request:**

```http
GET /_counterfact/api/routes
```

**Response:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "path": "/pets",
        "methods": {
          "GET": true,
          "POST": true
        }
      },
      {
        "path": "/pets/{id}",
        "methods": {
          "GET": true,
          "PUT": true,
          "DELETE": true
        }
      }
    ]
  }
}
```

**Use when:** Discovering available endpoints, understanding API structure.

---

## Common Usage Patterns

### Pattern 1: Inspect Current State

**User request:** "What pets are in the store?"

**Agent workflow:**

```
1. GET /_counterfact/api/health
   → Confirm server running

2. GET /_counterfact/api/contexts/pets
   → Retrieve pets array

3. Present formatted list to user
```

**Example response:**

```
Currently in the pet store:
- ID 1: Fido
- ID 2: Whiskers
```

---

### Pattern 2: Add Test Data

**User request:** "Add a new pet named Rex with ID 3"

**Agent workflow:**

```
1. GET /_counterfact/api/contexts/pets
   → Get current pets

2. Append new pet to array

3. POST /_counterfact/api/contexts/pets
   Body: { "pets": [...existingPets, newPet] }
   → Update context

4. Verify by GETting /pets endpoint
   → Confirm change visible in API
```

---

### Pattern 3: Simulate Failure

**User request:** "Make the user service unavailable"

**Agent workflow:**

```
1. POST /_counterfact/api/contexts/users
   Body: { "serviceAvailable": false }
   → Set failure flag

2. Explain that route handlers should check this flag

3. Optionally: Test GET /users to verify error
```

**Note:** The route handler must be coded to check `context.serviceAvailable`. The skill sets the flag, but behavior depends on route implementation.

---

### Pattern 4: Switch to Proxy Mode

**User request:** "Route /orders to the real API"

**Agent workflow:**

```
1. GET /_counterfact/api/config/proxy
   → Check current proxy settings

2. PATCH /_counterfact/api/config/proxy
   Body: {
     "proxyUrl": "https://api.production.com",
     "proxyPaths": [["/orders", true]]
   }
   → Enable proxy for /orders

3. Confirm that /orders now hits real server
```

---

### Pattern 5: Batch Data Setup

**User request:** "Set up test data: 3 users and 5 products"

**Agent workflow:**

```
1. Create users array with test data

2. POST /_counterfact/api/contexts/users
   Body: { "users": [...testUsers] }

3. Create products array with test data

4. POST /_counterfact/api/contexts/products
   Body: { "products": [...testProducts] }

5. Confirm setup complete
```

---

## Error Handling

### Server Not Running

If health check fails:

```
❌ Error: Counterfact server not running
Suggestion: Start the server with: npx counterfact openapi.yaml
```

### Context Not Found

If context doesn't exist:

```
GET /_counterfact/api/contexts/nonexistent
→ Returns: { "path": "/nonexistent", "context": {...} }
```

Note: Contexts are hierarchical. If `/api/users` doesn't exist, it returns parent context.

### Invalid JSON

If request body is malformed:

```
← 400 Bad Request
{ "success": false, "error": "Request body must be a valid JSON object" }
```

### Server Error

If internal error occurs:

```
← 500 Internal Server Error
{
  "success": false,
  "error": "Error message",
  "stack": "..." // Only in development
}
```

---

## Advanced Techniques

### Hierarchical Contexts

Contexts are hierarchical. If you have:

```
/               → root context
/api            → api context
/api/users      → users context
```

Then `GET /_counterfact/api/contexts/api/users/123` returns the `/api/users` context (closest parent).

### Smart Diffing

Context updates use smart diffing:

```javascript
// Old context: { users: [...], count: 5 }

POST { users: [...newUsers] }
// Result: { users: [...newUsers], count: 5 }
//         count is preserved
```

### Testing Proxied Requests

After setting proxy:

```
1. PATCH /_counterfact/api/config/proxy
   Body: { "proxyPaths": [["/users", true]] }

2. Make request to http://localhost:3100/users
   → This now proxies to real server

3. Check response headers for proxy evidence
```

---

## Limitations

1. **In-memory state**: Changes reset on server restart
2. **No TypeScript validation**: Context can accept any JSON object
3. **No authentication**: Admin API is unauthenticated (local development tool)
4. **No versioning**: API is v1, may evolve
5. **Context discovery**: Must know or discover paths, no automatic schema

---

## Security Considerations

⚠️ **Warning:** The Admin API provides full control over mock server state.

**Recommendations:**

- Only run Counterfact in development/testing environments
- Do not expose the Admin API to untrusted networks
- Configure a bearer token when exposing the Admin API beyond local development
- Be cautious with context updates from untrusted sources

**Current access controls:**

- By default, the Admin API only listens on the loopback interface (localhost)
- You can require a bearer token for all Admin API requests:
  - CLI flag: `--admin-api-token <TOKEN_VALUE>`
  - Environment variable: `COUNTERFACT_ADMIN_API_TOKEN=<TOKEN_VALUE>`
- When a token is configured, clients must send:
  - HTTP header: `Authorization: Bearer <TOKEN_VALUE>`
---

## Integration with OpenAPI

The skill works best when paired with OpenAPI understanding:

1. Read the OpenAPI spec to understand available paths
2. Map OpenAPI paths to context paths
3. Use OpenAPI schemas to validate context updates
4. Generate realistic test data based on OpenAPI examples

Example:

```
1. Read openapi.yaml
2. Find path /pets with schema: { id: number, name: string }
3. Generate test data: { id: 1, name: "Fido" }
4. POST /_counterfact/api/contexts/pets with test data
```

---

## Troubleshooting

**Issue:** Health check returns 404

**Solution:** Server may not have Admin API. Update to latest Counterfact version.

---

**Issue:** Context update doesn't affect API responses

**Solution:** Check route handler implementation. It must read from `$.context`.

Example route handler:

```typescript
export const GET: HTTP_GET = ($) => {
  return $.response[200].json($.context.pets);
};
```

---

**Issue:** Proxy not working

**Solution:**

- Verify proxyUrl is set: `GET /_counterfact/api/config/proxy`
- Check path is enabled: `proxyPaths` array
- Ensure path matches exactly (case-sensitive)

---

## See Also

- [Counterfact Documentation](https://counterfact.dev)
- [Admin API Examples](./examples.md)
- [Counterfact GitHub](https://github.com/pmcelhaney/counterfact)
