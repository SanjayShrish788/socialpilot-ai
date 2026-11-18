# SocialPilot AI

Autonomous Social Media Executive Agent for the WAE Consultancy Services Agent Maker-2026 competition.

A Next.js application that takes a brand through **BRAND → PLAN → CREATE → ENGAGE → INSIGHTS**, with a human approval checkpoint before every simulated public action. Ten responsive screens share a navy-sidebar SaaS interface.

## Run locally

Requires Node.js 20.9+ (tested with Node 24) and npm.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. No credentials are needed. The Bloom & Co. workspace is seeded automatically. Every successful action saves to browser localStorage. Use Settings to export, restore, or reset the demo.

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

Webpack is explicitly selected because Turbopack's CSS subprocess failed in the Windows sandbox. The application remains standard Next.js App Router code.

## What works

- Brand identity, industry, voice, audience, goals, prohibited phrases and channel selection.
- 30-day multi-channel calendar generation, date/channel filtering, grid/list views, draft editing and rescheduling. Existing date/channel slots are preserved.
- Platform-specific captions, hashtags, carousel outlines, preview, manual authoring and regeneration by generating another draft.
- Post review inbox with submit, approve, reject, edit, schedule and audit history. Editing invalidates approval.
- A tool execution workspace with typed schemas, validated inputs, structured outputs, errors and execution logs.
- Comments, DMs and mentions with intent classification, contextual reply drafts, human approval, simulated delivery and response timestamps.
- Crisis detection and escalation, assignment to the brand manager and explicit resolution. Resolving never approves a reply.
- Analytics charts, date/channel filters, illustrative reach/impressions, engagement, follower growth, schedule adherence, response time, computed workflow counts, insights and report export.
- Optional authenticated Supabase snapshot save/load with normalized relational records.
- Server-side Claude and OpenAI-compatible tool-call loops. Paid AI use requires a server access token.

## Demo versus live

| Capability             | Without credentials                                                | With configuration                                                 |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Persistence            | Browser-local workspace and JSON backups                           | Supabase Auth + explicit cloud snapshots                           |
| Agent                  | Deterministic controller executes actual application tools         | Claude/compatible model selects validated tools                    |
| Content                | Editable, platform-specific templates                              | Original writing through `write_content`                           |
| Calendar               | Template drafts for each day/channel                               | Model orchestrates the same calendar tool; templates are disclosed |
| Replies                | Context/category-specific templates                                | Model can write original replies through `write_reply`             |
| Publishing             | Manual demo scheduler; status says `Published (demo)`              | Adapter boundary only; live delivery is **not implemented**        |
| Comments/DMs/listening | Fictional seeded conversations                                     | Adapter interface; no live ingest yet                              |
| Analytics              | Clearly labeled illustrative dataset + actual demo workflow counts | Live platform metrics not connected                                |

Demo template writing does not fully interpret arbitrary voice instructions. Configure an AI provider for brand-specific original writing. Neither demo nor AI invents real publication claims. No social network API is called, even if someone sets arbitrary environment variables.

## Architecture

```text
Next.js pages / client components
  → WorkspaceProvider (loading, errors, local persistence, action lock)
  → POST /api/action (origin check, size limit, Zod validation)
  → transition engine OR bounded tool-using agent
  → validated result → localStorage → UI

Optional Settings cloud backup
  → Supabase email authentication
  → save_workspace RPC (authenticated owner, transaction, row lock)
  → latest JSON snapshot + normalized tables + append-only snapshot history
```

- `src/lib/workspace.ts`: domain types.
- `src/lib/validation.ts`: action, workspace and input schemas.
- `src/lib/engine.ts`: human transitions, approval guards, classification, audit.
- `src/lib/agent.ts`: executable tool registry; demo controller; Claude and compatible-provider tool protocols. At most 8 rounds and 12 model tool calls. Tools cannot approve or publish.
- `src/lib/integrations.ts`: social adapter contracts, demo/unconnected adapters, listening contract, scheduler due-date selector.
- `src/components`: responsive screen modules and shared UI.
- `supabase/migrations/001_initial.sql`: relational schema, row policies and atomic save function.
- `tests/workflows.test.ts`: workflow invariants and adapter behavior.

The browser sends its demo workspace to the stateless API. This isolates anonymous visitors and avoids a shared writable public demo database. It is intentionally **not** a tamper-proof production authorization system. Before real social publishing, move authoritative revisions/approvals to a server-owned database, add workspace reviewer roles, OAuth token encryption, rate limiting, webhook signature verification, retry/idempotency records and a durable job worker.

## Supabase setup

1. Create a Supabase project. Run `supabase/migrations/001_initial.sql` once in SQL Editor.
2. Enable email authentication and configure Site URL and redirect allowlist for `http://localhost:3000/integrations` and your deployed `/integrations` URL.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public publishable/anon key only). Restart/rebuild.
4. In Settings, enter your email, follow the sign-in link and use **Save to cloud**.
5. Load in another authenticated browser with **Load cloud**. Loading replaces local data; export a backup first.

`auth.users` provides users. Tables cover workspaces, brand profiles, social accounts, posts, calendar entries, approvals, engagement, crisis alerts, execution logs and analytics. RLS restricts reads to owners; writes use an authenticated security-definer function with a fixed search path. The function derives the owner from `auth.uid()`, never from client input. Saves are transactional and explicitly last-save-wins. Each snapshot is also retained in append-only history. No service-role key is required or exposed.

Cloud persistence is an optional backup/sync workflow, not automatic multi-user collaboration. The migration must be tested against your Supabase project before relying on cloud persistence. Local JSON backups remain available.

## AI setup

Copy `.env.example` to `.env.local`; never commit `.env.local`.

For Claude, set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to a model available in your account. For compatible providers set `AI_API_KEY`, `AI_MODEL`, and optionally `AI_BASE_URL` (HTTPS URL ending in `/v1`; default OpenAI).

Set `APP_ACCESS_TOKEN` to a long random secret. Enter that token (not the provider key) in Settings. It is kept in sessionStorage for the current tab session. Select the provider and run a workflow. Without valid authorization or provider credentials the request fails explicitly. The token is suitable for a controlled competition demo; replace it with per-user server authentication and quotas for a public paid service.

Official protocol references: [Claude tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) and [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

AI errors discard partial workspace mutations, rather than showing partially saved success. Provider errors are sanitized to avoid leaking credentials. Model context is untrusted; tools have bounded schemas, no arbitrary network/file access and no publishing capability. Keyword crisis detection is a baseline, not a complete moderation system.

## Social integrations and scheduler

Live integration intentionally fails closed. Implement `SocialAdapter` in `src/lib/integrations.ts` after obtaining platform access:

- Instagram / Meta: business or creator account as required by the chosen API; Meta app review; account/page scopes; OAuth callback, refresh/revocation and secure token storage; media container creation and publish flow; comment/webhook ingest.
- LinkedIn: developer app and approved member/organization posting permissions; organization roles where applicable; OAuth and secure token lifecycle; Posts API and approved analytics access.
- Listening: licensed provider feed or approved platform webhooks; verify signatures, deduplicate external event IDs, map into `Engagement`.

Confirm current permissions and API versions with the platform's official documentation when connecting. Do not paste platform tokens into the frontend. Publishing must check immutable content revision approval immediately before delivery, retain the returned platform ID and distinguish retryable failures from successful sends.

The current scheduler is deliberately manual: **Run demo scheduler** selects approved, scheduled posts due on or before today's UTC date and marks them simulated. Repeated runs do not duplicate delivery. There is no unattended cron or claim of real background publishing. Replace with a durable database job and platform-native cron after implementing real delivery.

## Security and limits

- Zod validates all action payloads; max request size is 2 MB, arrays bounded, provider timeout 45 seconds per round.
- Cross-origin mutations are rejected. No secrets are included in JSON health responses.
- All public statements and sensitive replies require explicit human approval; edits reset state.
- No arbitrary HTML rendering; React escapes generated content.
- Demo approval records are locally editable by the browser owner. Do not treat them as compliance-grade immutable records.
- SQL snapshots preserve history but are owner-supplied demo backups; do not authorize live operations from imported data.
- Production dependency audit was clean during verification. Development-only picomatch dependency advisories remain upstream; do not run lint against untrusted glob patterns. A forced npm downgrade is not applied because it would break Next.js compatibility.
- No external AI, Supabase or social credentials were available during local verification; those live paths are not claimed tested.

## GitHub and deployment

The intended public repository name is `socialpilot-ai`.

If publication is not already recorded in the final handoff:

```powershell
gh auth login
gh repo create socialpilot-ai --public --source . --remote origin --push
```

For Vercel, import the repository, choose Next.js, use Node 24, build command `npm run build`, and set optional environment variables. The demo works without any secrets. Authorize the intended team if Vercel reports missing access. Verify `/api/health`, create a draft, approve it and run the demo scheduler after deployment. Never report a deployment URL until Vercel reaches READY and the app has been checked.

See `docs/DEMO_SCRIPT.md`, `docs/SUBMISSION_CHECKLIST.md` and `docs/VERIFICATION.md` for the recording sequence and evidence.
