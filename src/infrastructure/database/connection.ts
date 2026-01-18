import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables in development only
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })
}

// Create Turso client
// In production (Vercel), env vars are loaded automatically
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/sqlite.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
