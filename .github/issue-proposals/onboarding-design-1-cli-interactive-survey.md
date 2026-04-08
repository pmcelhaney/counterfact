---
title: "Onboarding Design 1: CLI Interactive Survey on First Run"
parentIssue: 1724
labels:
  - enhancement
  - onboarding
  - ux
assignees: []
milestone:
---

Add an interactive onboarding survey to the CLI that appears the first time a user runs Counterfact. The survey asks a small number of focused questions to understand who the user is and what they hope to accomplish. Results are sent to PostHog only after explicit user consent.

## Motivation

We currently fire a `counterfact_started` telemetry event with technical properties (version, platform, Node version), but we have no signal about the *people* using Counterfact — their role, their team size, or the problems they're trying to solve. A brief first-run survey in the CLI is the lowest-friction way to gather this context because the user is already there, in the terminal, watching the startup banner.

## Design

On first run (detected by the absence of an `onboardingComplete` flag in `.counterfact/config.json`), the banner is followed by a short interactive prompt sequence rendered with `inquirer` (already commonly used in the Node ecosystem):

```
👋 Welcome to Counterfact! Before we start, can we ask you two quick questions?
   Your answers help us build a better tool. (Takes ~15 seconds.)

? What best describes your role?
  ❯ Frontend developer
    Backend / API developer
    QA / test automation engineer
    Full-stack developer
    Other

? What is the main problem you want to solve with Counterfact?
  ❯ Unblock frontend work while the API is still being built
    Write faster integration / end-to-end tests
    Demo or prototype an API
    Explore an OpenAPI spec interactively
    Other

📊 May we send these answers to our analytics platform (PostHog) so we can
   understand how Counterfact is being used?
   (Your answers are anonymous. You can opt out at any time.)
  ❯ Yes — send my answers
    No thanks

✅  Thanks! Counterfact is starting now…
```

- If the user declines consent, the answers are discarded and **nothing** is sent.
- If the user accepts, the answers are sent as a `onboarding_survey_completed` PostHog event with properties `role` and `primary_use_case`.
- The survey is shown exactly once. A `onboardingComplete: true` flag is written to `.counterfact/config.json` (creating the file if absent) after the survey finishes (regardless of consent choice) so it is never shown again.
- The survey is **skipped entirely** when `CI=true`, when `--no-repl` or `--no-open` flags indicate non-interactive use, or when stdin is not a TTY.

## Implementation notes

- Use `inquirer` (or equivalent ESM-compatible prompter) for interactive prompts.
- Persist the `onboardingComplete` flag in the same JSON config file used by any future Counterfact user preferences.
- Reuse the existing `PostHog` client already imported in `bin/counterfact.js`; fire the survey event in the same fire-and-forget pattern as `counterfact_started`.
- The telemetry guard logic (`isTelemetryDisabled`) that suppresses startup telemetry should be independent from the survey consent mechanism: the survey may appear even if global telemetry is disabled, but results are only sent if the user explicitly consents.

## Acceptance criteria

- [ ] The survey appears exactly once on first run in an interactive terminal.
- [ ] The survey is skipped when `CI=true` or stdin is not a TTY.
- [ ] Answering "No thanks" to the consent question results in zero PostHog events from the survey.
- [ ] Answering "Yes" sends a `onboarding_survey_completed` event to PostHog with `role` and `primary_use_case` properties.
- [ ] A `onboardingComplete: true` flag is persisted so the survey never appears again after the first run.
- [ ] The survey prompt cannot block or delay server startup (it runs before `start()` is called and resolves before proceeding).
- [ ] Existing telemetry behaviour (`counterfact_started`) is unaffected.
