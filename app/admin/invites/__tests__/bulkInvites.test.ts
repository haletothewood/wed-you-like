import { describe, expect, it } from 'vitest'
import { parseBulkInviteInput } from '../bulkInvites'

describe('parseBulkInviteInput', () => {
  it('parses comma-delimited rows with header', () => {
    const rows = parseBulkInviteInput(
      'name,email,plusOneAllowed\nAlex Smith,alex@example.com,yes\nJamie Lee,jamie@example.com,no'
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      lineNumber: 2,
      guestName: 'Alex Smith',
      email: 'alex@example.com',
      plusOneAllowed: true,
      errors: [],
    })
    expect(rows[1]).toMatchObject({
      lineNumber: 3,
      guestName: 'Jamie Lee',
      email: 'jamie@example.com',
      plusOneAllowed: false,
      errors: [],
    })
  })

  it('parses quoted CSV cells containing commas', () => {
    const rows = parseBulkInviteInput(
      'name,email,plusOneAllowed\n"Smith, Jr.",smith@example.com,true'
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      guestName: 'Smith, Jr.',
      email: 'smith@example.com',
      plusOneAllowed: true,
      errors: [],
    })
  })

  it('parses tab-delimited input', () => {
    const rows = parseBulkInviteInput('name\temail\tplusOneAllowed\nTaylor Morgan\ttaylor@example.com\t1')

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      guestName: 'Taylor Morgan',
      email: 'taylor@example.com',
      plusOneAllowed: true,
      errors: [],
    })
  })

  it('flags duplicate emails case-insensitively', () => {
    const rows = parseBulkInviteInput(
      'name,email\nAlex,ALEx@example.com\nJamie,alex@example.com'
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].errors).toContain('Duplicate email in bulk list')
    expect(rows[1].errors).toContain('Duplicate email in bulk list')
  })
})
