# Verification evidence

Verified locally on 18 November 2026 (Asia/Kolkata).

## Checks

- `npm test`: 13 passing tests covering approvals, edit invalidation, crisis classification, reply approval, calendar idempotency, prohibited phrases, error logs, adapter behavior, missing credentials, mocked Claude tool protocol, and actual embedded PostgreSQL migration/RLS checks.
- `npm run test:http`: all ten pages plus health return HTTP 200; create → submit → approve → schedule → simulated publish succeeds; unapproved post/reply, foreign origin, and unauthorized paid AI calls are rejected.
- `npm run lint`: clean after unused import/config fixes.
- `npm run typecheck`: successful.
- `npm run build`: webpack production build successful. Final verification includes the latest error-log, accessibility and analytics changes.
- `npm audit --omit=dev`: zero production vulnerabilities. 14 high development dependency findings remain around upstream picomatch; compatible audit fixes applied; destructive framework downgrade not applied.

## Browser walkthrough

1. Dashboard loaded and brand profile saved successfully.
2. PLAN executed `read_brand` and `create_calendar`; created 58 entries around the two existing slots, for 60 total.
3. Content Studio generated another draft (61 total) with captions, hashtags and carousel outline.
4. New draft submitted, approved in the dedicated inbox, scheduled and delivered only as `Published (demo)`.
5. Inbox triage drafted five replies; legal/injury message was marked sensitive and escalated.
6. Sensitive reply required human approval before the UI exposed Simulate sending.
7. Crisis resolution did not itself send a reply.
8. Analytics displayed 61 planned posts, one simulated publication, one simulated reply and zero remaining open alerts after human resolution.
9. Reload preserved the workspace and insights. Channel/date filters changed the dataset (Instagram recent week: 18,318 reach; 5.58% engagement).
10. Desktop and 390px responsive layouts inspected; mobile navigation opened and navigated successfully.
11. Browser logs had development Fast Refresh warnings, no application errors in the inspected log window.

Screenshot: `docs/dashboard.jpg`.

## Boundaries not verified live

- No paid AI provider call: provider protocol tested with mocked HTTP responses.
- Supabase migration/RLS verified with embedded PostgreSQL and a minimal auth fixture; hosted email delivery and real Supabase project not connected.
- Social adapters explicitly simulate or throw unconnected errors. No Instagram, LinkedIn, Meta or listening API claims.
- Vercel connector returned HTTP 403 for the configured team; user team authorization is required.
- Public video recording/upload remains manual; a complete 4-minute recording script is included.

