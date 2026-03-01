const normalizeCsvValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export const toCsvCell = (value: string | number | null | undefined): string => {
  const normalized = normalizeCsvValue(value)
  const escaped = normalized.replace(/"/g, '""')
  return `"${escaped}"`
}

export const toCsvRow = (values: Array<string | number | null | undefined>): string =>
  values.map((value) => toCsvCell(value)).join(',')
