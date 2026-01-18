import type { Config } from 'drizzle-kit'

// Note: For Turso migrations, use the Turso CLI directly:
// turso db shell wed-you-like < path/to/migration.sql
export default {
  schema: './src/infrastructure/database/schema.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./data/sqlite.db',
  },
} satisfies Config
