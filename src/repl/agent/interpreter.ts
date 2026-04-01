/**
 * Interpreter for Agent DSL operations.
 *
 * Executes a list of {@link Operation} objects against a plain context object.
 * No `eval`, no arbitrary JavaScript — each operation is dispatched explicitly.
 */

import type { Operation } from "./dsl-parser.js";

export type ExecutionResult = {
  operationsExecuted: number;
  operations: Operation[];
};

/**
 * Navigate the context object along `path`, returning the parent object and
 * the final key.  Throws a descriptive error if any intermediate segment is
 * missing or non-navigable.
 */
function navigateToParent(
  context: Record<string, unknown>,
  path: string[],
): { key: string; parent: Record<string, unknown> } {
  if (path.length === 0) {
    throw new Error("Operation path must not be empty.");
  }

  const parentSegments = path.slice(0, -1);
  const key = path[path.length - 1] as string;
  let current: Record<string, unknown> = context;

  for (const segment of parentSegments) {
    const next = current[segment];

    if (next === undefined || next === null) {
      throw new Error(
        `Cannot access "${segment}" on the context object: property does not exist.`,
      );
    }

    if (typeof next !== "object" || Array.isArray(next)) {
      throw new Error(
        `Cannot navigate through "${segment}": it is not an object.`,
      );
    }

    current = next as Record<string, unknown>;
  }

  return { key, parent: current };
}

/**
 * Execute a single operation against the given context object.
 */
export function executeOperation(
  context: Record<string, unknown>,
  operation: Operation,
): void {
  const { key, parent } = navigateToParent(context, operation.path);

  if (operation.kind === "set") {
    parent[key] = operation.value;

    return;
  }

  if (operation.kind === "call") {
    const fn = parent[key];

    if (typeof fn !== "function") {
      throw new Error(
        `"${operation.path.join(".")}" is not a callable method on the context object.`,
      );
    }

    (fn as (...args: unknown[]) => unknown).call(parent, ...operation.args);

    return;
  }

  // Exhaustive check — unreachable at runtime.
  /* istanbul ignore next */
  throw new Error(
    `Unknown operation kind: ${JSON.stringify(operation)}.`,
  );
}

/**
 * Execute a list of operations sequentially against the given context object.
 *
 * Throws on the first failing operation; partial side-effects are NOT rolled
 * back — callers that need atomicity should validate first.
 */
export function executeOperations(
  context: Record<string, unknown>,
  operations: Operation[],
): ExecutionResult {
  for (const operation of operations) {
    executeOperation(context, operation);
  }

  return {
    operations,
    operationsExecuted: operations.length,
  };
}
