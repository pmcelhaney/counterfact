---
"counterfact": minor
---

Add lightweight telemetry using PostHog to track usage of Counterfact. Fires a single `counterfact_started` event on startup. Telemetry is disabled by default before May 1, 2026, disabled in CI, and can be controlled with the `COUNTERFACT_TELEMETRY_DISABLED` environment variable. A one-time warning is shown before the rollout date.
