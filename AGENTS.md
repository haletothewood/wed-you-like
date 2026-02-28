# AGENTS.md

## Database Change Policy

When changing data models, schema, or persistence behavior, follow this workflow:

1. Make schema updates in `src/infrastructure/database/schema.ts`.
2. Generate a migration with `npm run db:generate`.
3. Commit both schema and generated migration files in `src/infrastructure/database/migrations/`.
4. Validate locally by running:
   - `npm run db:migrate`
   - `npm run -s build`
   - `npm test -- --run`
5. For preview/staging/prod, apply migrations to the target database before or with app deployment.

## Preview/Environment Guidance

- Use isolated preview databases (for example, Turso branches) instead of sharing production data.
- Do not assume preview databases have latest migrations.
- If a feature relies on new tables/columns, ship migrations together with code and ensure deploy pipeline applies them.

## Backward Compatibility

- Use additive, backward-compatible changes first (expand/contract style).
- Avoid destructive schema changes in the same release as application read/write changes.

## Non-Blocking Telemetry

- Analytics/telemetry writes (for example, campaign event logs) must be best-effort.
- Core flows (sending invites, test sends, RSVP operations) must continue even if telemetry persistence fails.

## Runbook

See [docs/migrations.md](/Users/your-user/Development/Personal/wed-you-like/docs/migrations.md) for operational steps.
