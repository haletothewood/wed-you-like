import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@libsql/client'

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!databaseUrl) {
  throw new Error('TURSO_DATABASE_URL is required')
}

const client = createClient({
  url: databaseUrl,
  authToken,
})

const projectRoot = process.cwd()
const migrationsDir = path.join(projectRoot, 'src/infrastructure/database/migrations')
const journalPath = path.join(migrationsDir, 'meta/_journal.json')

const journal = JSON.parse(await fs.readFile(journalPath, 'utf8'))
const entries = Array.isArray(journal.entries) ? journal.entries : []

if (entries.length === 0) {
  console.log('No migrations in journal. Nothing to do.')
  process.exit(0)
}

await client.execute(`
  CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    created_at NUMERIC
  )
`)

const existingResult = await client.execute(
  `SELECT hash FROM "__drizzle_migrations"`
)
const existingHashes = new Set(existingResult.rows.map((row) => String(row.hash)))

const isBenignAlreadyAppliedError = (message) => {
  const lower = message.toLowerCase()
  return (
    lower.includes('already exists') ||
    lower.includes('duplicate column name') ||
    lower.includes('duplicate')
  )
}

for (const entry of entries) {
  const filePath = path.join(migrationsDir, `${entry.tag}.sql`)
  const rawSql = await fs.readFile(filePath, 'utf8')
  const hash = crypto.createHash('sha256').update(rawSql).digest('hex')

  if (existingHashes.has(hash)) {
    console.log(`Skipping ${entry.tag} (already recorded)`)
    continue
  }

  const statements = rawSql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    try {
      await client.execute(statement)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!isBenignAlreadyAppliedError(message)) {
        throw error
      }

      // Migration appears already applied outside this runner.
      console.log(`Benign migration conflict in ${entry.tag}: ${message}`)
      break
    }
  }

  await client.execute({
    sql: `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (?, ?)`,
    args: [hash, Number(entry.when) || Date.now()],
  })
  existingHashes.add(hash)
  console.log(`Applied ${entry.tag}`)
}

console.log('Migrations applied successfully')
