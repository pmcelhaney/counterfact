---
"counterfact": minor
---

Add `ApiRunner` class in `src/api-runner.ts` that encapsulates the creation and lifecycle management of all Counterfact sub-systems (Registry, ContextRegistry, ScenarioRegistry, ScenarioFileGenerator, CodeGenerator, Dispatcher, Transpiler, ModuleLoader, and OpenApiDocument) for a single API specification.

Each sub-system is exposed as a public property. The class provides four composite methods — `generate()`, `load()`, `watch()`, and `stopWatching()` — that coordinate across multiple sub-systems based on the supplied configuration. Use the static async `ApiRunner.create(config)` factory method to construct an instance.

`counterfact()` in `app.ts` now uses `ApiRunner` internally.
