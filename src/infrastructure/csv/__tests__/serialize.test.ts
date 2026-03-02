import { describe, expect, it } from 'vitest'
import { toCsvCell, toCsvRow } from '../serialize'

describe('CSV serialize', () => {
  it('always wraps cells in quotes', () => {
    expect(toCsvCell('hello')).toBe('"hello"')
    expect(toCsvCell(42)).toBe('"42"')
  })

  it('escapes embedded quotes', () => {
    expect(toCsvCell('He said "hello"')).toBe('"He said ""hello"""')
  })

  it('normalizes windows newlines', () => {
    expect(toCsvCell('line1\r\nline2\rline3')).toBe('"line1\nline2\nline3"')
  })

  it('serializes null and undefined as empty cells', () => {
    expect(toCsvCell(null)).toBe('""')
    expect(toCsvCell(undefined)).toBe('""')
  })

  it('serializes full rows safely', () => {
    expect(toCsvRow(['Name, Jr.', 'quote "inside"', 'line1\nline2'])).toBe(
      '"Name, Jr.","quote ""inside""","line1\nline2"'
    )
  })
})
