import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import bcrypt from 'bcryptjs'

const root = process.cwd()
const targetDbPath = process.env.PLAYWRIGHT_DB_PATH || '/tmp/wyl-playwright.sqlite.db'
const migrationsDir = path.resolve(root, 'src/infrastructure/database/migrations')
const migrationJournalPath = path.resolve(
  root,
  'src/infrastructure/database/migrations/meta/_journal.json'
)

if (!existsSync(migrationJournalPath)) {
  throw new Error(`Migration journal not found at ${migrationJournalPath}`)
}

mkdirSync(path.dirname(targetDbPath), { recursive: true })
rmSync(targetDbPath, { force: true })
rmSync(`${targetDbPath}-journal`, { force: true })

const journal = JSON.parse(readFileSync(migrationJournalPath, 'utf8'))
if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
  throw new Error('No migration entries found in migration journal')
}

for (const entry of journal.entries) {
  const migrationPath = path.resolve(migrationsDir, `${entry.tag}.sql`)
  if (!existsSync(migrationPath)) {
    throw new Error(`Migration file missing: ${migrationPath}`)
  }
  const migrationSql = readFileSync(migrationPath, 'utf8')
  execFileSync('sqlite3', [targetDbPath, migrationSql], { stdio: 'inherit' })
}

const adminPasswordHash = await bcrypt.hash('change-me-immediately', 10)

const sql = `
PRAGMA foreign_keys = ON;
INSERT INTO admin_users (id, username, password_hash, email, is_active, created_at, updated_at)
VALUES ('e2e-admin', 'admin', '${adminPasswordHash}', 'admin@example.com', 1, unixepoch(), unixepoch())
ON CONFLICT(username) DO UPDATE SET
  password_hash = excluded.password_hash,
  email = excluded.email,
  is_active = 1,
  updated_at = unixepoch();

INSERT INTO invites (id, token, group_name, adults_count, children_count, plus_one_allowed, sent_at, created_at, updated_at)
VALUES
  ('e2e-invite-sent-pending', 'pw-sent-pending-token', 'PW Seed Sent Pending', 1, 0, 0, unixepoch(), unixepoch(), unixepoch()),
  ('e2e-invite-unsent-pending', 'pw-unsent-pending-token', 'PW Seed Unsent Pending', 1, 0, 0, NULL, unixepoch(), unixepoch()),
  ('e2e-invite-sent-responded', 'pw-sent-responded-token', 'PW Seed Sent Responded', 1, 0, 0, unixepoch(), unixepoch(), unixepoch());

INSERT INTO guests (id, name, email, invite_id, is_plus_one, is_child, parent_guest_id, is_invite_lead, created_at, updated_at)
VALUES
  ('e2e-guest-sent-pending', 'PW Sent Pending Guest', 'pw.sent.pending@example.com', 'e2e-invite-sent-pending', 0, 0, NULL, 1, unixepoch(), unixepoch()),
  ('e2e-guest-unsent-pending', 'PW Unsent Pending Guest', 'pw.unsent.pending@example.com', 'e2e-invite-unsent-pending', 0, 0, NULL, 1, unixepoch(), unixepoch()),
  ('e2e-guest-sent-responded', 'PW Sent Responded Guest', 'pw.sent.responded@example.com', 'e2e-invite-sent-responded', 0, 0, NULL, 1, unixepoch(), unixepoch());

INSERT INTO rsvps (id, invite_id, is_attending, adults_attending, children_attending, dietary_requirements, responded_at, created_at, updated_at)
VALUES
  ('e2e-rsvp-sent-responded', 'e2e-invite-sent-responded', 1, 1, 0, NULL, unixepoch(), unixepoch(), unixepoch());
`

execFileSync('sqlite3', [targetDbPath, sql], { stdio: 'inherit' })
console.log(`Prepared Playwright database at ${targetDbPath}`)
