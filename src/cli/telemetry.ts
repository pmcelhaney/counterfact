import { randomUUID } from "node:crypto";

import { PostHog } from "posthog-node";

const POSTHOG_API_KEY = "phc_msXmBxiL8FVugNMLCx9bnPQGqfEMqmyBjnVkKhHkN3m7";
const POSTHOG_HOST = "https://us.i.posthog.com";

/**
 * Returns `true` when telemetry should be sent.
 *
 * Telemetry is disabled in CI, when `COUNTERFACT_TELEMETRY_DISABLED=true`,
 * or before the May 2026 rollout date unless the user has explicitly opted
 * in with `COUNTERFACT_TELEMETRY_DISABLED=false`.
 */
export function isTelemetryEnabled(): boolean {
  if (process.env["CI"]) return false;

  const telemetryDisabledEnv = process.env["COUNTERFACT_TELEMETRY_DISABLED"];
  if (telemetryDisabledEnv === "true") return false;

  const isBeforeRollout = new Date() < new Date("2026-05-01");
  if (isBeforeRollout && telemetryDisabledEnv !== "false") return false;

  return true;
}

/**
 * Fires a telemetry event to PostHog.  Fire-and-forget — never blocks
 * startup and never surfaces errors to the user.
 */
export function sendTelemetry(version: string): void {
  const telemetryKey = process.env["POSTHOG_API_KEY"] ?? POSTHOG_API_KEY;
  const telemetryHost = process.env["POSTHOG_HOST"] ?? POSTHOG_HOST;

  try {
    const posthog = new PostHog(telemetryKey, { host: telemetryHost });

    posthog.capture({
      distinctId: randomUUID(),
      event: "counterfact_started",
      properties: {
        version,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        source: "counterfact-cli",
      },
    });

    posthog.flush().catch(() => {
      // ignore errors — telemetry is best-effort
    });
  } catch {
    // ignore errors — telemetry must never surface to the user
  }
}
