import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "node:fs";
import path from "node:path";

import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.ts";

// Import the main function - other functions are not exported so we test through integration
import { updateRouteTypes } from "../../src/migrate/update-route-types.js";

describe("update-route-types migration", () => {
  describe("basic migration scenarios", () => {
    it("migrates HTTP_GET to operationId-based type name", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet/{id}": {
            get: {
              operationId: "getPetById",
              parameters: [
                {
                  in: "path",
                  name: "id",
                  schema: { type: "string" },
                },
              ],
              responses: {
                200: {
                  description: "Success",
                },
              },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_GET } from "../types/paths/pet/{id}.types.ts";

export const GET: HTTP_GET = ($) => {
  return { status: 200 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet/{id}.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/pet/{id}.ts"),
            "utf8",
          );

          expect(updatedContent).toContain("import type { getPetById }");
          expect(updatedContent).toContain("export const GET: getPetById");
          expect(updatedContent).not.toContain("HTTP_GET");
        },
      );
    });

    it("migrates HTTP_POST to operationId-based type name", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet": {
            post: {
              operationId: "addPet",
              requestBody: {
                content: {
                  "application/json": {
                    schema: { type: "object" },
                  },
                },
              },
              responses: {
                201: {
                  description: "Created",
                },
              },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_POST } from "../types/paths/pet.types.ts";

export const POST: HTTP_POST = ($) => {
  return { status: 201 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/pet.ts"),
            "utf8",
          );

          expect(updatedContent).toContain("import type { addPet }");
          expect(updatedContent).toContain("export const POST: addPet");
          expect(updatedContent).not.toContain("HTTP_POST");
        },
      );
    });

    it("migrates multiple HTTP methods in the same file", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet/{id}": {
            get: {
              operationId: "getPetById",
              responses: { 200: { description: "Success" } },
            },
            put: {
              operationId: "updatePet",
              responses: { 200: { description: "Updated" } },
            },
            delete: {
              operationId: "deletePet",
              responses: { 204: { description: "Deleted" } },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_GET, HTTP_PUT, HTTP_DELETE } from "../types/paths/pet/{id}.types.ts";

export const GET: HTTP_GET = ($) => {
  return { status: 200 };
};

export const PUT: HTTP_PUT = ($) => {
  return { status: 200 };
};

export const DELETE: HTTP_DELETE = ($) => {
  return { status: 204 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet/{id}.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/pet/{id}.ts"),
            "utf8",
          );

          expect(updatedContent).toContain(
            "import type { getPetById, updatePet, deletePet }",
          );
          expect(updatedContent).toContain("export const GET: getPetById");
          expect(updatedContent).toContain("export const PUT: updatePet");
          expect(updatedContent).toContain("export const DELETE: deletePet");
          expect(updatedContent).not.toContain("HTTP_GET");
          expect(updatedContent).not.toContain("HTTP_PUT");
          expect(updatedContent).not.toContain("HTTP_DELETE");
        },
      );
    });

    it("handles root path route", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/": {
            get: {
              operationId: "getRoot",
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_GET } from "../types/paths/index.types.ts";

export const GET: HTTP_GET = ($) => {
  return { status: 200 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/index.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/index.ts"),
            "utf8",
          );

          expect(updatedContent).toContain("import type { getRoot }");
          expect(updatedContent).toContain("export const GET: getRoot");
        },
      );
    });

    it("keeps HTTP_METHOD when no operationId is present", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/anonymous": {
            get: {
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_GET } from "../types/paths/anonymous.types.ts";

export const GET: HTTP_GET = ($) => {
  return { status: 200 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/anonymous.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          // Should return false because no changes needed (HTTP_GET stays HTTP_GET)
          expect(migrated).toBe(false);

          const updatedContent = await fs.readFile(
            getPath("routes/anonymous.ts"),
            "utf8",
          );

          // File should remain unchanged
          expect(updatedContent).toContain("import type { HTTP_GET }");
          expect(updatedContent).toContain("export const GET: HTTP_GET");
        },
      );
    });
  });

  describe("nested routes", () => {
    it("migrates routes in nested directories", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/api/v1/users/{id}": {
            get: {
              operationId: "getUserById",
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_GET } from "../../../types/paths/api/v1/users/{id}.types.ts";

export const GET: HTTP_GET = ($) => {
  return { status: 200 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/api/v1/users/{id}.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/api/v1/users/{id}.ts"),
            "utf8",
          );

          expect(updatedContent).toContain("import type { getUserById }");
          expect(updatedContent).toContain("export const GET: getUserById");
        },
      );
    });

    it("processes multiple files across different directories", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pets": {
            get: {
              operationId: "listPets",
              responses: { 200: { description: "Success" } },
            },
          },
          "/pets/{id}": {
            get: {
              operationId: "getPetById",
              responses: { 200: { description: "Success" } },
            },
          },
          "/users": {
            get: {
              operationId: "listUsers",
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pets.ts": `import type { HTTP_GET } from "../types/paths/pets.types.ts";
export const GET: HTTP_GET = ($) => ({ status: 200 });`,
          "routes/pets/{id}.ts": `import type { HTTP_GET } from "../types/paths/pets/{id}.types.ts";
export const GET: HTTP_GET = ($) => ({ status: 200 });`,
          "routes/users.ts": `import type { HTTP_GET } from "../types/paths/users.types.ts";
export const GET: HTTP_GET = ($) => ({ status: 200 });`,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const petsContent = await fs.readFile(
            getPath("routes/pets.ts"),
            "utf8",
          );
          expect(petsContent).toContain("import type { listPets }");
          expect(petsContent).toContain("export const GET: listPets");

          const petByIdContent = await fs.readFile(
            getPath("routes/pets/{id}.ts"),
            "utf8",
          );
          expect(petByIdContent).toContain("import type { getPetById }");
          expect(petByIdContent).toContain("export const GET: getPetById");

          const usersContent = await fs.readFile(
            getPath("routes/users.ts"),
            "utf8",
          );
          expect(usersContent).toContain("import type { listUsers }");
          expect(usersContent).toContain("export const GET: listUsers");
        },
      );
    });
  });

  describe("idempotency", () => {
    it("does not modify files that have already been migrated", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet/{id}": {
            get: {
              operationId: "getPetById",
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      const alreadyMigratedFile = `import type { getPetById } from "../types/paths/pet/{id}.types.ts";

export const GET: getPetById = ($) => {
  return { status: 200 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet/{id}.ts": alreadyMigratedFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          // Should return false because file is already migrated
          expect(migrated).toBe(false);

          const updatedContent = await fs.readFile(
            getPath("routes/pet/{id}.ts"),
            "utf8",
          );

          // File should remain exactly the same
          expect(updatedContent).toBe(alreadyMigratedFile);
        },
      );
    });

    it("can be run multiple times without issues", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet": {
            post: {
              operationId: "addPet",
              responses: { 201: { description: "Created" } },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_POST } from "../types/paths/pet.types.ts";

export const POST: HTTP_POST = ($) => {
  return { status: 201 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          // First migration
          const firstMigration = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );
          expect(firstMigration).toBe(true);

          const afterFirstMigration = await fs.readFile(
            getPath("routes/pet.ts"),
            "utf8",
          );

          // Second migration
          const secondMigration = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );
          expect(secondMigration).toBe(false);

          const afterSecondMigration = await fs.readFile(
            getPath("routes/pet.ts"),
            "utf8",
          );

          // Content should be identical after both runs
          expect(afterFirstMigration).toBe(afterSecondMigration);
          expect(afterSecondMigration).toContain("import type { addPet }");
        },
      );
    });
  });

  describe("edge cases", () => {
    it("skips _.context.ts files", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet": {
            get: {
              operationId: "listPets",
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      const contextFile = `export interface Context {
  // HTTP_GET should not be touched in context files
}
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet.ts": `import type { HTTP_GET } from "../types/paths/pet.types.ts";
export const GET: HTTP_GET = ($) => ({ status: 200 });`,
          "routes/_.context.ts": contextFile,
        },
        async (tempDir, { path: getPath }) => {
          await updateRouteTypes(tempDir, getPath("openapi.json"));

          const contextContent = await fs.readFile(
            getPath("routes/_.context.ts"),
            "utf8",
          );

          // Context file should remain unchanged
          expect(contextContent).toBe(contextFile);
        },
      );
    });

    it("returns false when no routes directory exists", async () => {
      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify({
            openapi: "3.0.0",
            paths: {},
          }),
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(false);
        },
      );
    });

    it("returns false when openApiPath is '_'", async () => {
      await withTemporaryFiles({}, async (tempDir) => {
        const migrated = await updateRouteTypes(tempDir, "_");

        expect(migrated).toBe(false);
      });
    });

    it("handles files without HTTP_ imports gracefully", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet": {
            get: {
              operationId: "listPets",
              responses: { 200: { description: "Success" } },
            },
          },
        },
      };

      const nonMigrationFile = `// Some other file without HTTP_ imports

export const config = {
  enabled: true
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/config.ts": nonMigrationFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(false);

          const content = await fs.readFile(
            getPath("routes/config.ts"),
            "utf8",
          );
          expect(content).toBe(nonMigrationFile);
        },
      );
    });

    it("handles import statements with various whitespace formats", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/pet": {
            get: {
              operationId: "getPet",
              responses: { 200: { description: "Success" } },
            },
            post: {
              operationId: "addPet",
              responses: { 201: { description: "Created" } },
            },
          },
        },
      };

      const routeFile = `import type {HTTP_GET,   HTTP_POST  } from "../types/paths/pet.types.ts";

export const GET:HTTP_GET = ($) => {
  return { status: 200 };
};

export const POST : HTTP_POST= ($) => {
  return { status: 201 };
};
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/pet.ts"),
            "utf8",
          );

          expect(updatedContent).toContain("getPet");
          expect(updatedContent).toContain("addPet");
          expect(updatedContent).not.toContain("HTTP_GET");
          expect(updatedContent).not.toContain("HTTP_POST");
        },
      );
    });

    it("handles all HTTP methods", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        paths: {
          "/resource": {
            get: {
              operationId: "getResource",
              responses: { 200: { description: "Success" } },
            },
            post: {
              operationId: "createResource",
              responses: { 201: { description: "Created" } },
            },
            put: {
              operationId: "updateResource",
              responses: { 200: { description: "Updated" } },
            },
            patch: {
              operationId: "patchResource",
              responses: { 200: { description: "Patched" } },
            },
            delete: {
              operationId: "deleteResource",
              responses: { 204: { description: "Deleted" } },
            },
            head: {
              operationId: "headResource",
              responses: { 200: { description: "OK" } },
            },
            options: {
              operationId: "optionsResource",
              responses: { 200: { description: "OK" } },
            },
          },
        },
      };

      const routeFile = `import type { HTTP_GET, HTTP_POST, HTTP_PUT, HTTP_PATCH, HTTP_DELETE, HTTP_HEAD, HTTP_OPTIONS } from "../types/paths/resource.types.ts";

export const GET: HTTP_GET = ($) => ({ status: 200 });
export const POST: HTTP_POST = ($) => ({ status: 201 });
export const PUT: HTTP_PUT = ($) => ({ status: 200 });
export const PATCH: HTTP_PATCH = ($) => ({ status: 200 });
export const DELETE: HTTP_DELETE = ($) => ({ status: 204 });
export const HEAD: HTTP_HEAD = ($) => ({ status: 200 });
export const OPTIONS: HTTP_OPTIONS = ($) => ({ status: 200 });
`;

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/resource.ts": routeFile,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(true);

          const updatedContent = await fs.readFile(
            getPath("routes/resource.ts"),
            "utf8",
          );

          expect(updatedContent).toContain("getResource");
          expect(updatedContent).toContain("createResource");
          expect(updatedContent).toContain("updateResource");
          expect(updatedContent).toContain("patchResource");
          expect(updatedContent).toContain("deleteResource");
          expect(updatedContent).toContain("headResource");
          expect(updatedContent).toContain("optionsResource");

          // Verify none of the old names remain
          expect(updatedContent).not.toContain("HTTP_GET");
          expect(updatedContent).not.toContain("HTTP_POST");
          expect(updatedContent).not.toContain("HTTP_PUT");
          expect(updatedContent).not.toContain("HTTP_PATCH");
          expect(updatedContent).not.toContain("HTTP_DELETE");
          expect(updatedContent).not.toContain("HTTP_HEAD");
          expect(updatedContent).not.toContain("HTTP_OPTIONS");
        },
      );
    });
  });

  describe("error handling", () => {
    it("handles invalid OpenAPI spec gracefully", async () => {
      await withTemporaryFiles(
        {
          "openapi.json": "{ invalid json",
          "routes/pet.ts": `import type { HTTP_GET } from "../types/paths/pet.types.ts";
export const GET: HTTP_GET = ($) => ({ status: 200 });`,
        },
        async (tempDir, { path: getPath }) => {
          // Should not throw, should return false
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(false);
        },
      );
    });

    it("handles spec with no paths", async () => {
      const openApiSpec = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      };

      await withTemporaryFiles(
        {
          "openapi.json": JSON.stringify(openApiSpec),
          "routes/pet.ts": `import type { HTTP_GET } from "../types/paths/pet.types.ts";
export const GET: HTTP_GET = ($) => ({ status: 200 });`,
        },
        async (tempDir, { path: getPath }) => {
          const migrated = await updateRouteTypes(
            tempDir,
            getPath("openapi.json"),
          );

          expect(migrated).toBe(false);
        },
      );
    });
  });
});
