import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as schema from './schema'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') })

// Create Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/sqlite.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
