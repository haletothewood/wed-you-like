import type { Config } from 'drizzle-kit'
import fs from 'node:fs'
import path from 'node:path'

const localSqliteUrl = 'file:./data/sqlite.db'
const dbUrl = process.env.TURSO_DATABASE_URL || localSqliteUrl

if (dbUrl.startsWith('file:')) {
  const sqlitePath = dbUrl.slice('file:'.length)
  const sqliteDir = path.resolve(process.cwd(), path.dirname(sqlitePath))
  fs.mkdirSync(sqliteDir, { recursive: true })
}

// Note: For Turso migrations, use the Turso CLI directly:
// turso db shell wed-you-like < path/to/migration.sql
export default {
  schema: './src/infrastructure/database/schema.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config
