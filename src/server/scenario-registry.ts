import { isStartupFunction } from "./startup.js";

type ScenarioModule = Record<string, unknown>;

export class ScenarioRegistry {
  private readonly modules = new Map<string, ScenarioModule>();

  public add(key: string, module: ScenarioModule): void {
    this.modules.set(key, module);
  }

  public remove(key: string): void {
    this.modules.delete(key);
  }

  public getModule(fileKey: string): ScenarioModule | undefined {
    return this.modules.get(fileKey);
  }

  /**
   * Returns the names of all exported functions for the given file key.
   * Used for tab completion.
   */
  public getExportedFunctionNames(fileKey: string): string[] {
    const module = this.modules.get(fileKey);

    if (!module) return [];

    return Object.keys(module).filter((k) => typeof module[k] === "function");
  }

  /**
   * Returns all loaded file keys (e.g. "index", "myscript", "sub/script").
   * Used for tab completion to enumerate available scenario files.
   */
  public getFileKeys(): string[] {
    return [...this.modules.keys()];
  }

  /**
   * Returns all scenario functions tagged with `startup()` across all loaded
   * modules. These are called automatically when the server starts.
   */
  public getStartupFunctions(): Array<(...args: unknown[]) => unknown> {
    const result: Array<(...args: unknown[]) => unknown> = [];

    for (const module of this.modules.values()) {
      for (const value of Object.values(module)) {
        if (isStartupFunction(value)) {
          result.push(value as (...args: unknown[]) => unknown);
        }
      }
    }

    return result;
  }
}
