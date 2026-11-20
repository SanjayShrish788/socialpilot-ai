# WAE submission checklist

## Project

- [ ] Public GitHub repository opens without authentication.
- [ ] README explains architecture, setup, demo/live distinctions and limitations.
- [ ] Repository includes lockfile, SQL migration, .env.example, automated tests and demo script.
- [ ] No credentials, personal inbox data or secrets committed.
- [ ] Fresh clone: npm ci, npm test, npm run lint, npm run typecheck, npm run build.

## Demonstration

- [ ] Record the real 3–5 minute workflow in DEMO_SCRIPT.md.
- [ ] Show BRAND → PLAN → CREATE → ENGAGE → INSIGHTS.
- [ ] Show human approval, edit invalidation and crisis escalation.
- [ ] Clearly identify templates, simulated publishing and illustrative analytics.
- [ ] Public video URL opens signed out; audio and text are clear.
- [ ] Do not claim external AI/social calls unless connected and verified.

## Deployment (if supplied)

- [ ] Vercel build reaches READY in the intended account/team.
- [ ] Visit URL signed out and verify page + /api/health.
- [ ] Complete a create → review → schedule → demo publish flow.
- [ ] No paid model API exposed without authentication.

## Submission form

- [ ] Confirm the official WAE form URL and current rules independently.
- [ ] Fill your name, contact information and student/team details accurately.
- [ ] Project name: SocialPilot AI — Autonomous Social Media Executive Agent.
- [ ] Add verified public GitHub and video URLs; deployment URL only if verified.
- [ ] Suggested description: “A social media executive workspace with brand-aware planning, content creation, tool execution logs, human approval gates, engagement triage, crisis escalation and transparent demo analytics.”
- [ ] Review all claims and links before you submit yourself.

The form has not been submitted. The supplied three-page agent brief did not contain the submission form URL or full contest rules; the 3–5 minute public video requirement comes from the user's request.

## Assignment audit and remaining work

| PDF requirement                                      | Submission evidence                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand voice, channels and goals                      | Editable profile drives planning context. Demo copy uses templates.                                                                               |
| Monthly calendar, captions, hashtags and carousels   | Two seeded channels, 30-day planner, editable copy and slide outlines, and a preview. Dedicated design-tool integration remains outside the demo. |
| Scheduler and approval checkpoint                    | Human review, exact approved revision check, audit history and simulated delivery. The scheduler runs on demand.                                  |
| Comments, DMs, brand mentions and issue escalation   | Fictional inbox, classification and drafts, Crisis Center conversation links, approval and simulated replies.                                     |
| Reach, engagement, follower growth and response time | Labeled sample platform metrics and separately computed workspace activity. Native channel reporting is unconnected.                              |
| Next.js, Tailwind, Postgres and Claude tool use      | Runnable app, tested SQL migration and mocked Claude tool loop. Hosted services require credentials.                                              |
| Instagram, LinkedIn, Meta and social listening APIs  | Demo data and adapter contracts. Live delivery, ingestion and analytics still require implementation and platform access.                         |

- [x] Competition demo runs without external credentials.
- [x] Scheduler regression verifies that a changed post is blocked while another approved post still publishes in demo mode.
- [x] Timed 4:10 script includes exact clicks, sample inputs and narration.
- [x] Public GitHub repository contains the submission branch.
- [ ] Vercel production URL. The connected team returned HTTP 403. Follow the README deployment steps.
- [ ] Record and verify the public video URL, then complete the competition form.
