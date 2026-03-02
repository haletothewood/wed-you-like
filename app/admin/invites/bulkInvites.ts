export interface BulkInviteRow {
  lineNumber: number
  guestName: string
  email: string
  plusOneAllowed: boolean
  rawPlusOne: string
  errors: string[]
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const parsePlusOneValue = (
  value: string
): { value: boolean; valid: boolean } => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return { value: false, valid: true }
  if (['true', 'yes', 'y', '1'].includes(normalized)) return { value: true, valid: true }
  if (['false', 'no', 'n', '0'].includes(normalized)) return { value: false, valid: true }
  return { value: false, valid: false }
}

const parseDelimitedLine = (line: string, delimiter: ',' | '\t'): string[] => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      const nextChar = line[i + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === delimiter) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells
}

const detectDelimiter = (line: string): ',' | '\t' => {
  if (line.includes('\t')) return '\t'
  return ','
}

const hasHeaderRow = (columns: string[]): boolean => {
  const normalized = columns.map((column) => column.trim().toLowerCase())
  return normalized.includes('name') && normalized.includes('email')
}

export const parseBulkInviteInput = (input: string): BulkInviteRow[] => {
  const lines = input.split(/\r?\n/)
  const nonEmptyLines = lines
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((entry) => entry.line.length > 0)

  if (nonEmptyLines.length === 0) return []

  const delimiter = detectDelimiter(nonEmptyLines[0].line)
  const firstRowColumns = parseDelimitedLine(nonEmptyLines[0].line, delimiter).map((column) =>
    column.trim()
  )
  const rowsToParse = hasHeaderRow(firstRowColumns)
    ? nonEmptyLines.slice(1)
    : nonEmptyLines

  const parsedRows = rowsToParse.map(({ line, lineNumber }) => {
    const columns = parseDelimitedLine(line, delimiter).map((column) => column.trim())
    const guestName = columns[0] || ''
    const email = columns[1] || ''
    const rawPlusOne = columns[2] || ''
    const plusOneParsed = parsePlusOneValue(rawPlusOne)
    const errors: string[] = []

    if (!guestName) errors.push('Missing guest name')
    if (!email) errors.push('Missing email')
    if (email && !EMAIL_PATTERN.test(email)) errors.push('Invalid email')
    if (!plusOneParsed.valid) errors.push('Plus one must be yes/no, true/false, 1/0')

    return {
      lineNumber,
      guestName,
      email,
      plusOneAllowed: plusOneParsed.value,
      rawPlusOne,
      errors,
    }
  })

  const emailCounts = parsedRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.email.trim().toLowerCase()
    if (!key) return acc
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return parsedRows.map((row) => {
    const key = row.email.trim().toLowerCase()
    if (key && emailCounts[key] > 1) {
      return { ...row, errors: [...row.errors, 'Duplicate email in bulk list'] }
    }
    return row
  })
}

export const BULK_TEMPLATE_CSV = `name,email,plusOneAllowed
Alex Smith,alex@example.com,yes
Jamie Lee,jamie@example.com,no
Taylor Morgan,taylor@example.com,true
`
