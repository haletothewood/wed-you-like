# Migration Runbook

## Local Development

1. Update schema:
   - `src/infrastructure/database/schema.ts`
2. Generate migration:
   - `npm run db:generate`
3. Apply migration locally:
   - `npm run db:migrate`
4. Validate:
   - `npm run -s build`
   - `npm test -- --run`

## Preview / Staging

1. Ensure preview/staging uses an isolated database.
2. Apply migrations to that database before or during deployment.
3. Deploy app code that depends on the migration.
4. Smoke-test critical flows:
   - invite send
   - test send
   - reports load

## Production

1. Apply migration first (or in the same controlled release step).
2. Deploy application code.
3. Run post-deploy checks on core flows.

## Design Rules

- Prefer additive schema changes first; cleanup/removal can be follow-up.
- Keep telemetry/analytics logging best-effort so core product flows do not fail if logging tables lag.
- Avoid hand-editing old migration files that were already applied; create a new migration instead.
