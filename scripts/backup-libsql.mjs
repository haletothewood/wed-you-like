import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@libsql/client'

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
const outputPath = process.argv[2]

if (!databaseUrl) {
  throw new Error('TURSO_DATABASE_URL is required')
}

if (!outputPath) {
  throw new Error('Output path argument is required')
}

const client = createClient({
  url: databaseUrl,
  authToken,
})

const quoteIdentifier = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`

const toSqlLiteral = (value) => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (value instanceof Uint8Array) {
    const hex = Buffer.from(value).toString('hex')
    return `X'${hex}'`
  }

  const text = String(value).replace(/'/g, "''")
  return `'${text}'`
}

const lines = []
lines.push('PRAGMA foreign_keys = OFF;')
lines.push('BEGIN TRANSACTION;')

const schemaResult = await client.execute(`
  SELECT type, name, sql
  FROM sqlite_master
  WHERE name NOT LIKE 'sqlite_%'
    AND sql IS NOT NULL
  ORDER BY CASE type
    WHEN 'table' THEN 0
    WHEN 'index' THEN 1
    WHEN 'trigger' THEN 2
    WHEN 'view' THEN 3
    ELSE 4
  END, name
`)

const tableNames = []
for (const row of schemaResult.rows) {
  if (row.type === 'table') {
    tableNames.push(String(row.name))
  }
  lines.push(`${row.sql};`)
}

for (const tableName of tableNames) {
  const rowsResult = await client.execute(`SELECT * FROM ${quoteIdentifier(tableName)}`)
  for (const row of rowsResult.rows) {
    const columns = Object.keys(row).map(quoteIdentifier).join(', ')
    const values = Object.values(row).map(toSqlLiteral).join(', ')
    lines.push(`INSERT INTO ${quoteIdentifier(tableName)} (${columns}) VALUES (${values});`)
  }
}

lines.push('COMMIT;')
lines.push('PRAGMA foreign_keys = ON;')
lines.push('')

await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, lines.join('\n'), 'utf8')

console.log(`Backup written to ${outputPath}`)
