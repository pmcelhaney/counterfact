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

  it("returns true when no opt-out env vars are set", () => {
    delete process.env["CI"];
    delete process.env["COUNTERFACT_TELEMETRY_DISABLED"];
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
