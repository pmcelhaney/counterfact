/**
 * DSL Parser for the Counterfact Agent.
 *
 * The DSL is a constrained language for expressing operations on the `context`
 * object.  Each line is one of:
 *
 *   Property assignment:  context.<path> = <json-value>
 *   Method call:          context.<path>(<json-args>)
 *
 * Grammar (v1):
 *   program    = statement*
 *   statement  = assignment | methodCall
 *   assignment = "context" "." path "=" jsonValue ";"?
 *   methodCall = "context" "." path "(" argList? ")" ";"?
 *   path       = identifier ("." identifier)*
 *   identifier = [a-zA-Z_][a-zA-Z0-9_]*
 *   argList    = jsonValue ("," jsonValue)*
 *   jsonValue  = string | number | boolean | null | object | array
 *
 * Not allowed: variables, loops, conditionals, function declarations, imports,
 * eval, new, this, process, global, computed property access ([…]), or any
 * root identifier other than "context".
 */

export type SetOperation = {
  kind: "set";
  path: string[];
  value: unknown;
};

export type CallOperation = {
  kind: "call";
  path: string[];
  args: unknown[];
};

export type Operation = SetOperation | CallOperation;

const BANNED_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "eval()", pattern: /\beval\s*\(/ },
  { label: "Function()", pattern: /\bFunction\s*\(/ },
  { label: "require()", pattern: /\brequire\s*\(/ },
  { label: "import", pattern: /\bimport\s*[\s(]/ },
  { label: "new", pattern: /\bnew\s+/ },
  { label: "this", pattern: /\bthis\b/ },
  { label: "process", pattern: /\bprocess\b/ },
  { label: "global", pattern: /\bglobal\b/ },
  { label: "__proto__", pattern: /__proto__/ },
  { label: ".prototype", pattern: /\.prototype\b/ },
  { label: ".constructor", pattern: /\.constructor\b/ },
];

const IDENTIFIER_RE = /^[a-z_]\w*/i;
const PATH_RE = /^[a-z_]\w*(?:\.[a-z_]\w*)*/i;

function validateSafety(statement: string): void {
  for (const { label, pattern } of BANNED_PATTERNS) {
    if (pattern.test(statement)) {
      throw new Error(
        `Unsafe construct "${label}" is not allowed in DSL statements.`,
      );
    }
  }

  // Disallow computed property access outside of JSON values by checking for
  // bracket notation on identifiers (e.g. context[x]).
  if (/\bcontext\[/.test(statement)) {
    throw new Error(
      "Computed property access (context[…]) is not allowed in DSL statements.",
    );
  }
}

function parseJsonValue(valueStr: string, context: string): unknown {
  try {
    return JSON.parse(valueStr) as unknown;
  } catch {
    throw new Error(
      `Invalid JSON value "${valueStr}" in: "${context}". Values must be valid JSON.`,
    );
  }
}

function parseArgList(argsStr: string, context: string): unknown[] {
  const trimmed = argsStr.trim();

  if (!trimmed) {
    return [];
  }

  // Wrap in an array so JSON.parse handles comma-separated values.
  try {
    const parsed = JSON.parse(`[${trimmed}]`) as unknown[];

    return parsed;
  } catch {
    throw new Error(
      `Invalid argument list "${trimmed}" in: "${context}". Arguments must be valid JSON.`,
    );
  }
}

/**
 * Parse a single DSL line into an Operation.
 *
 * Throws an Error if the line is not a valid DSL statement.
 */
export function parseDslLine(line: string): Operation {
  // Strip optional trailing semicolon and surrounding whitespace.
  const trimmed = line.trim().replace(/;$/, "").trimEnd();

  if (!trimmed.startsWith("context.")) {
    throw new Error(
      `Invalid DSL statement: "${trimmed}". Statements must start with "context.".`,
    );
  }

  validateSafety(trimmed);

  const body = trimmed.slice("context.".length);

  if (!IDENTIFIER_RE.test(body)) {
    throw new Error(
      `Invalid path in DSL statement: "${trimmed}". Expected a dot-separated identifier path after "context.".`,
    );
  }

  const pathMatch = PATH_RE.exec(body);

  // PATH_RE will always match here since we already checked IDENTIFIER_RE.
  /* istanbul ignore next */
  if (!pathMatch) {
    throw new Error(`Invalid path in DSL statement: "${trimmed}".`);
  }

  const pathStr = pathMatch[0];
  const path = pathStr.split(".");
  const remainder = body.slice(pathStr.length).trimStart();

  // ── Method call: context.a.b(args) ──────────────────────────────────────
  if (remainder.startsWith("(")) {
    if (!remainder.endsWith(")")) {
      throw new Error(
        `Unclosed parenthesis in method call: "${trimmed}". Expected closing ")".`,
      );
    }

    const argsStr = remainder.slice(1, -1);
    const args = parseArgList(argsStr, trimmed);

    return { args, kind: "call", path };
  }

  // ── Property assignment: context.a.b = value ────────────────────────────
  if (remainder.startsWith("=") && !remainder.startsWith("==")) {
    const valueStr = remainder.slice(1).trimStart();

    if (!valueStr) {
      throw new Error(`Missing value in assignment: "${trimmed}".`);
    }

    const value = parseJsonValue(valueStr, trimmed);

    return { kind: "set", path, value };
  }

  throw new Error(
    `Invalid DSL statement: "${trimmed}". Expected "=" for assignment or "()" for method call.`,
  );
}

/**
 * Parse a multi-line DSL program into a list of Operations.
 *
 * Empty lines and lines starting with "//" are ignored.
 * Throws an Error on the first invalid statement.
 */
export function parseDsl(dsl: string): Operation[] {
  const operations: Operation[] = [];

  for (const rawLine of dsl.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) {
      continue;
    }

    operations.push(parseDslLine(line));
  }

  return operations;
}
