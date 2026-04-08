---
title: "Onboarding Design 3: Progressive Disclosure with a Deferred Survey Nudge"
parentIssue: 1724
labels:
  - enhancement
  - onboarding
  - ux
assignees: []
milestone:
---

Adopt a progressive disclosure approach to onboarding: show contextual tips inline as the user interacts with Counterfact, and surface a brief survey only after the user has had a chance to explore the tool. Survey results are sent to PostHog only with explicit consent. There is no up-front wizard or blocking prompt.

## Motivation

First-run wizards and surveys can feel like a toll booth — something to click through before you can use the product. A progressive approach respects users' desire to get started immediately while still providing guidance and gathering feedback at a moment when the user has enough context to give meaningful answers (after they've explored the tool, not before).

## Design

### Phase 1 — "Getting Started" panel (shown on first visit)

The first time the dashboard loads (`localStorage.getItem('counterfact.onboarded')` is absent), a collapsible **"Getting Started"** panel appears above the route table:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🚀 Getting started with Counterfact                         [Dismiss]│
│                                                                     │
│ ① Your mock API is running — try a request in the API Tester →      │
│ ② Edit route files in routes/ to customize responses                │
│ ③ Open the Swagger UI to explore the full API →                     │
│ ④ Read the Usage Guide for tips and examples →                      │
└─────────────────────────────────────────────────────────────────────┘
```

Each item is a clickable link or action (e.g., opens the API Tester, highlights the routes directory, opens a new tab). Clicking "Dismiss" collapses the panel and sets `localStorage.setItem('counterfact.gettingStartedDismissed', '1')`.

### Phase 2 — Contextual tooltips

On the first visit to each major feature (route table, API Tester, REPL), a small tooltip badge is shown near the relevant UI element:

- Route table: "Tip: Click a row to see request details."
- API Tester: "Tip: Choose a route, fill in parameters, and press Send."

Each tooltip is dismissed on click and its state persisted to `localStorage`.

### Phase 3 — Deferred survey nudge (shown after engagement threshold)

After the user has dismissed the Getting Started panel **or** after they have been running Counterfact for a threshold period (tracked by storing a `counterfact.firstSeenAt` timestamp in `localStorage` and checking on load), a subtle, non-blocking nudge appears in the **bottom-right corner** of the dashboard:

```
┌────────────────────────────────────┐
│ 💬 Help us improve Counterfact     │
│ Answer 2 quick questions?  [Open]  │
│                            [Later] │
└────────────────────────────────────┘
```

Clicking "Open" expands the nudge into an inline card:

```
What best describes your role?
○ Frontend developer  ○ Backend / API developer
○ QA / test automation  ○ Full-stack developer  ○ Other

What is your primary use case?
○ Unblock frontend while API is being built
○ Write integration / end-to-end tests
○ Demo or prototype an API
○ Explore an OpenAPI spec  ○ Other

□ I consent to sending these answers to the Counterfact team (PostHog)
[ Submit ]  [ No thanks ]
```

Clicking "Later" sets a `counterfact.surveyDeferredUntil` timestamp 7 days in the future. Clicking "No thanks" or "Submit" permanently suppresses the nudge (`counterfact.surveySuppressed = '1'`).

### Survey submission (same as Design 2)

- Survey answers POST to `/counterfact/api/onboarding-survey` on the Koa server.
- The server fires `onboarding_survey_completed` to PostHog only when `consent: true`.

## Implementation notes

- All panel/tooltip/nudge state is stored in `localStorage`; no server-side persistence is required.
- The engagement threshold for the deferred survey is "Getting Started panel dismissed or `counterfact.firstSeenAt` is more than 5 minutes ago". This keeps implementation simple while targeting users who have actually tried the tool.
- The nudge is implemented as a fixed-position `<div>` appended to the dashboard body; CSS transitions handle expand/collapse.
- Reuse the same `POST /counterfact/api/onboarding-survey` Koa endpoint described in Design 2 for the survey submission.
- The Getting Started panel and tooltips are added to `src/client/index.html.hbs`; the nudge widget can be a small self-contained JS module loaded in the same template.

## Acceptance criteria

- [ ] The Getting Started panel is visible on first visit and hidden on subsequent visits after dismissal.
- [ ] Each contextual tooltip is shown once per feature and dismissed on click.
- [ ] The survey nudge appears only after the engagement threshold is reached (panel dismissed or 5+ minutes since first visit).
- [ ] Clicking "Later" defers the nudge for 7 days; clicking "No thanks" or "Submit" permanently suppresses it.
- [ ] Submitting with consent checked sends a `onboarding_survey_completed` PostHog event from the server.
- [ ] Submitting without consent or clicking "No thanks" sends no PostHog event.
- [ ] All onboarding state is stored in `localStorage` only; no server-side persistence is needed.
- [ ] The survey nudge does not block or obscure the route table, API Tester, or any other interactive element.
- [ ] The `POST /counterfact/api/onboarding-survey` endpoint returns `204 No Content` on success and `400 Bad Request` on invalid payload.
