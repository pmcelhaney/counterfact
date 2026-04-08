---
title: "Onboarding Design 2: Web Dashboard Welcome Wizard with Survey"
parentIssue: 1724
labels:
  - enhancement
  - onboarding
  - ux
assignees: []
milestone:
---

Add a multi-step welcome wizard to the Counterfact web dashboard (`/counterfact/`) that appears the first time a user visits after a fresh install. The wizard introduces key features, includes an optional one-page survey, and sends results to PostHog only with explicit consent. The terminal startup experience is unchanged.

## Motivation

Many users will navigate to the dashboard URL printed in the terminal banner. The dashboard is a richer medium than the terminal: it can display visuals, let users click through steps at their own pace, and surface links to documentation and examples. A lightweight in-browser wizard is more inviting than a CLI prompt for users who are less comfortable in the terminal.

## Design

### Step flow

When the dashboard is loaded for the first time (detected via `localStorage.getItem('counterfact.onboarded')`), a full-screen overlay modal is shown over the existing route table. The modal contains four steps, navigated with "Next →" and "← Back" buttons:

**Step 1 — Welcome**

```
🎉 Welcome to Counterfact!
You now have a live mock API running at http://localhost:{PORT}.
Here's what you can do with it.
```

- Three icon+text cards: "Edit route files", "Inspect requests in real time", "Use Swagger UI to explore your API"
- Button: "Show me how →"

**Step 2 — Your routes**

Highlights the route table behind the modal with a pulsing border, explains what each column means. Links to the usage guide.

**Step 3 — Try a request**

Shows a cURL example or a clickable link that calls one of the discovered routes. Users can click "Try it" which navigates to the `/counterfact/test-api` page with the route pre-selected.

**Step 4 — Quick survey (optional)**

```
Help us improve Counterfact (takes 30 seconds)

What best describes your role?
○ Frontend developer   ○ Backend / API developer
○ QA / test automation  ○ Full-stack developer  ○ Other

What is your primary use case?
○ Unblock frontend while API is being built
○ Write integration / end-to-end tests
○ Demo or prototype an API
○ Explore an OpenAPI spec
○ Other

□ Send my anonymous answers to the Counterfact team via PostHog

[ Skip ]  [ Submit and finish ]
```

Clicking "Skip" or "Submit and finish" sets `localStorage.setItem('counterfact.onboarded', '1')` and closes the modal.

### Survey submission

- The frontend sends survey answers to a new lightweight endpoint `POST /counterfact/api/onboarding-survey` exposed by the Koa server.
- The server handler fires a `onboarding_survey_completed` PostHog event only when `consent: true` is included in the payload.
- If PostHog telemetry is globally disabled (`isTelemetryDisabled`), the endpoint still accepts the request but skips the PostHog call — consent is still recorded.

## Implementation notes

- Implement the wizard as a plain HTML/CSS/vanilla JS overlay added to `src/client/index.html.hbs`. No additional frontend framework is required. The existing Vue.js 3 component used by the API tester is a reference for how JS is loaded in templates, but the wizard itself should be vanilla JS to avoid adding a compile step.
- Store the `onboarded` flag in `localStorage` (client-side only); no server-side state is needed to decide whether to show the wizard.
- The new `/counterfact/api/onboarding-survey` route should be registered alongside the existing Koa routes in `src/server/create-koa-app.ts`.

## Acceptance criteria

- [ ] The welcome wizard appears automatically on the first visit to the dashboard.
- [ ] The wizard does not appear on subsequent visits (persisted via `localStorage`).
- [ ] All four steps are reachable via Next/Back navigation, and the modal can be dismissed at any step.
- [ ] Submitting the survey with consent checked sends a `onboarding_survey_completed` PostHog event from the server.
- [ ] Submitting without checking consent (or clicking Skip) sends no PostHog event.
- [ ] The route table behind the modal is still accessible after the wizard is closed.
- [ ] The wizard does not interfere with the existing API tester or Swagger UI pages.
- [ ] The `POST /counterfact/api/onboarding-survey` endpoint returns `204 No Content` on success and `400 Bad Request` on invalid payload.
