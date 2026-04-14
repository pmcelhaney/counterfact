---
"counterfact": patch
---

Refactor: extract a `ScenarioFileGenerator` class that encapsulates `writeScenarioContextType` and `writeDefaultScenariosIndex`, complete with its own file-system watcher for the `routes/` directory. `app.ts` now calls `ScenarioFileGenerator` directly instead of hooking into `contextRegistry` events.
