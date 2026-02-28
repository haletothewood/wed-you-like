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
- [x] Wedding settings management
- [x] Reporting dashboard + CSV exports
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

- [ ] `TODO` Email templates: create
- [ ] `TODO` Email templates: edit
- [ ] `TODO` Email templates: preview
- [ ] `TODO` Email templates: test-send
- [ ] `TODO` Add invite reminders for non-responders
- [ ] `TODO` Add invite list filters/search (`sent`, `responded`, `attending`, name/email)
- [ ] `TODO` Improve RSVP UX polish (clear validation messages, fewer alerts)
- [ ] `TODO` Bug bash pass across admin + RSVP flows
- [ ] `TODO` Add/expand tests for fixed bugs

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

## Database Tasks

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:seed-all
```
