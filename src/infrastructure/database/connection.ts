import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const isLocalDev = !process.env.TURSO_DATABASE_URL

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/sqlite.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

if (isLocalDev && process.env.NODE_ENV !== 'test') {
  console.log('📦 Using local SQLite database')
}

export const db = drizzle(client, { schema })
