import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { isTelemetryEnabled, sendTelemetry } from "../../src/cli/telemetry.js";

describe("isTelemetryEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when CI is set", () => {
    process.env["CI"] = "true";
    expect(isTelemetryEnabled()).toBe(false);
  });

  it("returns false when COUNTERFACT_TELEMETRY_DISABLED is 'true'", () => {
    delete process.env["CI"];
    process.env["COUNTERFACT_TELEMETRY_DISABLED"] = "true";
    expect(isTelemetryEnabled()).toBe(false);
  });

  it("returns false before the rollout date when telemetry is not explicitly enabled", () => {
    delete process.env["CI"];
    delete process.env["COUNTERFACT_TELEMETRY_DISABLED"];
    // The current date is before 2026-05-01, so telemetry is off by default
    expect(isTelemetryEnabled()).toBe(false);
  });

  it("returns true when COUNTERFACT_TELEMETRY_DISABLED is 'false' (explicit opt-in)", () => {
    delete process.env["CI"];
    process.env["COUNTERFACT_TELEMETRY_DISABLED"] = "false";
    expect(isTelemetryEnabled()).toBe(true);
  });
});

describe("sendTelemetry", () => {
  it("does not throw when called", () => {
    expect(() => {
      sendTelemetry("1.0.0");
    }).not.toThrow();
  });
});
