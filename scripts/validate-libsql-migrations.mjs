import fs from 'node:fs/promises'
import path from 'node:path'

const migrationsDir = path.join(process.cwd(), 'src/infrastructure/database/migrations')
const journalPath = path.join(migrationsDir, 'meta/_journal.json')

const journal = JSON.parse(await fs.readFile(journalPath, 'utf8'))
const entries = Array.isArray(journal.entries) ? journal.entries : []

const countStatements = (sql) => {
  let count = 0
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i += 1) {
    const current = sql[i]
    const next = sql[i + 1]

    if (inLineComment) {
      if (current === '\n') inLineComment = false
      continue
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false
        i += 1
      }
      continue
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (current === '-' && next === '-') {
        inLineComment = true
        i += 1
        continue
      }
      if (current === '/' && next === '*') {
        inBlockComment = true
        i += 1
        continue
      }
    }

    if (current === "'" && !inDouble && !inBacktick) {
      inSingle = !inSingle
      continue
    }

    if (current === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble
      continue
    }

    if (current === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick
      continue
    }

    if (current === ';' && !inSingle && !inDouble && !inBacktick) {
      count += 1
    }
  }

  return count
}

const failures = []

for (const entry of entries) {
  const filePath = path.join(migrationsDir, `${entry.tag}.sql`)
  const rawSql = await fs.readFile(filePath, 'utf8')
  const chunks = rawSql
    .split('--> statement-breakpoint')
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  chunks.forEach((chunk, index) => {
    const statementCount = countStatements(chunk)
    if (statementCount > 1) {
      failures.push(
        `${entry.tag}.sql chunk ${index + 1} contains ${statementCount} SQL statements. Add '--> statement-breakpoint' between statements so LibSQL can execute them one at a time.`
      )
    }
  })
}

if (failures.length > 0) {
  console.error('LibSQL migration validation failed:\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('LibSQL migration validation passed')
