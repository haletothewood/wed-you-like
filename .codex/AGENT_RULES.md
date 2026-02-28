# Agent Workflow Rules (Project-Specific)

These rules are mandatory for agents working in this repo.

## Prioritization

1. Focus on product features and bug fixes first while pre-launch.
2. Defer hardening/scalability work unless explicitly requested or required for launch.

## Commit and PR Discipline

1. Make feature-scoped commits as work is completed.
2. Do not batch unrelated changes into one commit.
3. When a logical feature slice is complete, open a PR immediately.
4. PR descriptions must be detailed and include:
   - summary of scope
   - exact files/endpoints changed
   - behavior notes
   - validation results
   - follow-up items (if any)

## Required Validation Before Review/Merge

Before asking for review or merge, always run and report:

1. `npm run build`
2. `npm run lint`
3. `npm test -- --run`

If any check fails:

1. Fix the issue.
2. Re-run all three commands.
3. Only then update the PR.

## Safety for Production Access Changes

For production auth/account changes:

1. Use a safe sequence (create/verify recovery access first).
2. Verify changes with explicit read checks.
3. Confirm final credentials/state clearly to the user.
