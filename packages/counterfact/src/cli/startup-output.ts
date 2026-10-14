import type { Config } from "../config.js";

const ansi = {
  bold: "\u001B[1m",
  cyan: "\u001B[36m",
  dim: "\u001B[2m",
  green: "\u001B[32m",
  red: "\u001B[31m",
  reset: "\u001B[0m",
  yellow: "\u001B[33m",
};

export type StartupOutput = {
  error: (message: string) => string;
  progress: (message: string, frame?: string) => string;
  success: (label: string, value?: string) => string;
  title: (version: string) => string;
  warning: (message: string) => string;
};

/**
 * Returns whether Counterfact should add ANSI colour codes to startup output.
 * Redirected output is deliberately plain and NO_COLOR always wins.
 */
export function shouldUseColor(params: {
  isTTY: boolean | undefined;
  noColor: string | undefined;
}): boolean {
  return params.isTTY === true && params.noColor === undefined;
}

function describeGeneratedArtifacts(
  config: Pick<Config, "generate">,
  hasOpenApi: boolean,
): string | undefined {
  const generatesRoutes = hasOpenApi && config.generate.routes;
  const generatesTypes = config.generate.types;

  if (generatesRoutes && generatesTypes) {
    return "routes and types";
  }

  if (generatesRoutes) {
    return "routes";
  }

  if (generatesTypes) {
    return "types";
  }

  return undefined;
}

/** Returns the next truthful lifecycle message before the runtime starts. */
export function createRuntimeProgressMessage(
  config: Pick<Config, "generate">,
  hasOpenApi: boolean,
): string {
  const generatedArtifacts = describeGeneratedArtifacts(config, hasOpenApi);

  return generatedArtifacts === undefined
    ? "Loading mock routes…"
    : `Generating ${generatedArtifacts}…`;
}

/**
 * Builds a compact, semantic startup presentation without depending on a
 * third-party terminal-styling package.
 */
export function createStartupOutput(useColor: boolean): StartupOutput {
  const color = (code: string, value: string) =>
    useColor ? `${code}${value}${ansi.reset}` : value;

  return {
    title(version) {
      return `${color(ansi.bold, "Counterfact")} ${color(ansi.dim, `v${version}`)}`;
    },
    progress(message, frame = "→") {
      return `${color(ansi.cyan, frame)} ${color(ansi.dim, message)}`;
    },
    success(label, value) {
      const detail =
        value === undefined ? "" : ` ${color(ansi.cyan, `→ ${value}`)}`;
      return `${color(ansi.green, "✓")} ${color(ansi.green, label)}${detail}`;
    },
    warning(message) {
      return color(ansi.yellow, message);
    },
    error(message) {
      return color(ansi.red, message);
    },
  };
}

/** Owns the transient progress line; redirected output has no terminal controls. */
export function createStartupReporter(
  output: StartupOutput,
  stream: { isTTY?: boolean; write: (text: string) => unknown },
) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
      stream.write("\r\u001B[2K");
    }
  };

  return {
    async step<T>(message: string, operation: () => Promise<T>): Promise<T> {
      stop();
      if (stream.isTTY === true) {
        let frame = 0;
        const render = () => {
          stream.write(
            `\r\u001B[2K${output.progress(message, frames.at(frame))}`,
          );
          frame = (frame + 1) % frames.length;
        };
        render();
        timer = setInterval(render, 80);
        timer.unref();
      } else {
        stream.write(`${output.progress(message)}\n`);
      }

      try {
        return await operation();
      } finally {
        stop();
      }
    },
  };
}

/**
 * Returns the completed generation line only when the selected mode actually
 * generated source files.
 */
export function createGeneratedArtifactsSummary(
  config: Pick<Config, "generate">,
  hasOpenApi: boolean,
): string | undefined {
  const generatedArtifacts = describeGeneratedArtifacts(config, hasOpenApi);

  return generatedArtifacts === undefined
    ? undefined
    : `Generated ${generatedArtifacts}`;
}

/** Describes precisely which generated artifacts Counterfact is watching. */
export function createWatchSummary(
  config: Pick<Config, "watch">,
  hasOpenApi: boolean,
): string | undefined {
  const watchesRoutes = hasOpenApi && config.watch.routes;
  const watchesTypes = config.watch.types;

  if (watchesRoutes && watchesTypes) {
    return "Watching routes and types";
  }

  if (watchesRoutes) {
    return "Watching routes";
  }

  if (watchesTypes) {
    return "Watching types";
  }

  return undefined;
}

/** Returns the Swagger UI links exposed by the resolved OpenAPI specs. */
export function createSwaggerUrls(
  origin: string,
  specs: ReadonlyArray<{ group: string; source: string }>,
): string[] {
  return specs
    .filter((spec) => spec.source !== "_")
    .map(
      (spec) =>
        `${origin}/counterfact/swagger${spec.group ? `/${spec.group}` : ""}/`,
    );
}
