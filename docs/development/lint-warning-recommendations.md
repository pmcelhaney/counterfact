# Lint warning recommendations

Baseline (2026-04-16): `yarn lint` reports 112 warnings across 8 rules.

| Rule | Warnings | Recommendation | Why |
| --- | ---: | --- | --- |
| `security/detect-non-literal-fs-filename` | 50 | Selectively fix or ignore violations | Most hits are expected dynamic paths in file-system tooling; keep the rule for signal, but use validation wrappers and targeted ignores where inputs are trusted. |
| `security/detect-object-injection` | 31 | Selectively fix or ignore violations | Many hits are dynamic key lookups on known maps. Keep the rule, but prefer `Map`/guarded access in risky paths and suppress known-safe cases. |
| `jest/no-conditional-in-test` | 17 | Selectively fix or ignore violations | Some conditionals are legitimate for shared test helpers/table-driven cases; rewrite simple cases, keep explicit ignores for intentional patterns. |
| `import/no-named-as-default-member` | 4 | Disable it | Current warnings are false-positive noise from `js-yaml` interop in tests; disabling improves signal-to-noise. |
| `regexp/prefer-named-capture-group` | 3 | Fix violations | Small, mechanical updates (`(?:...)` or named groups) improve readability and can be fixed quickly. |
| `jest/expect-expect` | 3 | Selectively fix or ignore violations | Some tests assert by expecting thrown errors/side effects through helpers; add explicit assertions where possible and ignore intentional patterns. |
| `security/detect-unsafe-regex` | 2 | Selectively fix or ignore violations | One warning is from tooling config; review each regex for ReDoS risk and suppress only proven-safe patterns. |
| `jest/no-disabled-tests` | 2 | Fix violations | Skipped tests should be either re-enabled or removed to avoid long-term blind spots. |

## Suggested priority

1. Fix now: `regexp/prefer-named-capture-group`, `jest/no-disabled-tests`
2. Selective cleanup: `security/*`, `jest/no-conditional-in-test`, `jest/expect-expect`
3. Disable: `import/no-named-as-default-member`

## `security/detect-object-injection` triage (remaining 31 warnings)

- **Refactor candidates (runtime data from specs/requests):**
  - `src/cli/run.ts` (2)
  - `src/repl/repl.ts` (1)
  - `src/server/context-registry.ts` (7)
  - `src/server/json-to-xml.ts` (1)
  - `src/server/module-tree.ts` (1)
  - `src/server/response-builder.ts` (10)
  - `src/server/response-validator.ts` (1)
  - `src/typescript-generator/requirement.ts` (1)
- **Test-only warnings (lower risk, can be ignored or locally suppressed with rationale):**
  - `test/repl/repl.test.ts` (2)
  - `test/server/module-tree.test.ts` (2)
  - `test/typescript-generator/operation-type-coder.test.ts` (3)
