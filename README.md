# Wed You Like

Personal wedding website and RSVP management app.

This project is optimized for a real wedding timeline: reliable enough, protected enough, and simple enough to maintain.

## Product Goals

- Collect RSVPs cleanly and quickly from invited guests.
- Manage invites, meals, and questions from one admin portal.
- Export clean data for venue/catering.
- Keep infra/security lean to avoid exposure and surprise costs.

## Current Capabilities

- [x] Admin login/logout with session cookie
- [x] Invite management (individual + group)
- [x] Tokenized public RSVP links
- [x] RSVP submission/update
- [x] Attendance (yes/no)
- [x] Per-guest selection (groups)
- [x] Plus-one support (where enabled)
- [x] Meal selections (starter/main/dessert)
- [x] Custom RSVP questions (text/single/multi choice)
- [x] Dietary requirements
- [x] Email sending for invites (Resend + template variables)
- [x] Day-of photo-share campaign emails from Reports
- [x] RSVP reminder campaign for pending invites
- [x] Wedding settings management
- [x] Reporting dashboard + CSV exports
- [x] Email template editor with guided + raw HTML modes
- [x] Email template live preview and test-send
- [x] Signed admin hero image uploads
- [x] Dedicated guest photo upload page (`/photos/[token]`)
- [x] Signed guest photo uploads (invite-token authorized)
- [x] Automated tests for core domain/use-cases/validation

## Lean Security and Cost Guardrails

These are the practical protections for a personal wedding app.

- [ ] Add rate limit for `POST /api/rsvp/[token]`
- [ ] Enable Vercel WAF/bot protection and basic firewall rules
- [ ] Add Vercel spend/usage alerts
- [ ] Add Resend send/usage alerts
- [ ] Add minimal request logging for spike detection
- [ ] Validate RSVP payload ownership server-side (meals belong to invite guests)
- [ ] Validate question response IDs server-side
- [ ] Optional: expire RSVP token access after RSVP deadline

## Roadmap and Progress Tracker

Status legend: `TODO` | `IN PROGRESS` | `DONE`

### Phase 1: Features and Fixes (Now)

- [x] `DONE` Email templates: create
- [x] `DONE` Email templates: edit
- [x] `DONE` Email templates: preview
- [x] `DONE` Email templates: test-send
- [x] `DONE` Hero image upload in template editor
- [x] `DONE` Dedicated photo upload page (`/photos/[token]`)
- [x] `DONE` Day-of photo-share email campaign
- [x] `DONE` Add invite reminders for non-responders
- [x] `DONE` Add invite list filters/search (`sent`, `responded`, `attending`, name/email)
- [x] `DONE` Improve RSVP UX polish (clear validation messages, inline meal selection highlighting)
- [x] `DONE` Bug bash pass across admin + RSVP flows
- [x] `DONE` Add/expand tests for fixed bugs

### Phase 2: Venue and Seating Workflow (Next)

- [ ] `TODO` Table assignments: table CRUD
- [ ] `TODO` Table assignments: assign guests to tables
- [ ] `TODO` Table assignments: capacity checks
- [ ] `TODO` Include table assignment summary in exports/UI

### Phase 3: Nice-to-Haves (If Time)

- [ ] `TODO` Thank-you email flow
- [ ] `TODO` Better reporting filters/date ranges
- [ ] `TODO` Small admin QoL improvements (bulk send, bulk reminder)

### Phase 4: Pre-Launch Guardrails (Before Sharing Publicly)

- [ ] `TODO` Add RSVP POST rate limiting
- [ ] `TODO` Add server-side payload ownership checks
- [ ] `TODO` Add cost/usage alerting on Vercel + Resend
- [ ] `TODO` Add basic abuse/spike logging
- [ ] `TODO` Enable Vercel WAF/bot protection and basic firewall rules
- [ ] `TODO` Add Vercel spend/usage alerts
- [ ] `TODO` Add Resend send/usage alerts

## Working Plan (How We Execute)

1. Build features and close bugs until the full wedding workflow feels complete.
2. Move to table planning once RSVP collection features are stable.
3. Pull in nice-to-haves only if they unblock real planning/admin work.
4. Complete pre-launch guardrails right before sharing links publicly.

## Wedding Operations Timeline (Invites -> RSVPs -> Reports)

Use this timeline as the default runbook.

### T-8 to T-6 Weeks: Setup

1. Configure wedding settings (date/time/venue, RSVP deadline, registry, notes).
2. Finalize meal options and custom questions.
3. Import or create all invites (individuals/groups).
4. Verify active invite email template content and placeholders.

### T-6 Weeks: Send Invites

1. Send invite emails from Invite management.
2. Confirm each invite has `sentAt` populated.
3. Spot-check a few personal RSVP links.

### T-5 to T-2 Weeks: Collect RSVPs

1. Track response progress in Reports:
   - total invites vs total responses
   - attending vs not attending
   - no-response count
2. Send RSVP reminders from Reports using `Send RSVP Reminders`.
   - Targets only sent invites with no RSVP yet.
   - Skips unsent invites, responded invites, and invites without email.

### T-10 to T-3 Days: Finalize Numbers

1. Download `Export Venue Report` CSV:
   - one row per attending guest
   - table assignment (or Unassigned)
   - starter/main/dessert selections
   - meal count summary appended
2. Download `Export Meal Counts` CSV for quick caterer totals.
3. Share exports with venue/caterer and lock in final changes.

### Wedding Day

1. Send day-of photo upload links from Reports using `Send Photo Share Emails`.
2. Guests upload via personal photo links.

## Weekly Check-In Template

Copy this into issues/notes each week:

- Week of: `YYYY-MM-DD`
- What was completed:
- What is in progress:
- What is blocked:
- Next week focus:

## Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: SQLite/Turso with Drizzle ORM
- Email: Resend
- Validation: Zod
- Testing: Vitest

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

Notes:
- Builds an isolated SQLite DB at `/tmp/wyl-playwright.sqlite.db` from repo migrations on each run.
- Ensures an admin login exists: `admin / change-me-immediately`.

## Production Release Flow

Production deploys are now gated behind GitHub Actions:

1. Open PR to `main`
2. `Migration Guard` checks schema/migration consistency
3. Merge PR
4. `Release Production` workflow runs on `main`:
   - backup production Turso DB (`.dump`) and upload as artifact
   - apply migrations (`npm run db:migrate`)
   - build app
   - deploy to Vercel production

`vercel.json` disables direct Vercel Git auto-deploys, so code does not deploy ahead of migrations.

### Required GitHub Secrets

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `BASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Optional:
- `BLOB_HERO_IMAGE_ACCESS` (`public` or `private`; defaults to `private`)

### Rollback

1. Promote previous healthy deployment in Vercel (app rollback).
2. If a DB rollback is required:
   - download `turso-pre-migrate-backup-*` artifact from the failed `Release Production` run
   - restore/import to Turso using your DB restore procedure

## Database Tasks

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:seed-all
```
