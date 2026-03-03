import { describe, expect, it } from 'vitest'
import {
  buildTableSeatingSummary,
  canAssignSeatToTable,
  getGuestTypeLabel,
} from '@/infrastructure/seating/seating'

describe('getGuestTypeLabel', () => {
  it('labels child guests explicitly', () => {
    expect(getGuestTypeLabel({ isChild: true, isPlusOne: false })).toBe('Child')
  })

  it('labels plus-one guests explicitly', () => {
    expect(getGuestTypeLabel({ isChild: false, isPlusOne: true })).toBe('Plus One')
  })

  it('defaults to adult for standard guests', () => {
    expect(getGuestTypeLabel({ isChild: false, isPlusOne: false })).toBe('Adult')
  })
})

describe('buildTableSeatingSummary', () => {
  it('counts every assignment as a seat, including plus-ones', () => {
    const summary = buildTableSeatingSummary(
      [
        { id: 'table-1', tableNumber: 1, capacity: 3 },
        { id: 'table-2', tableNumber: 2, capacity: 6 },
      ],
      [
        { tableId: 'table-1' }, // adult
        { tableId: 'table-1' }, // plus-one
        { tableId: 'table-1' }, // child
        { tableId: 'table-2' },
      ]
    )

    expect(summary[0]).toEqual({
      id: 'table-1',
      tableNumber: 1,
      capacity: 3,
      assignedSeats: 3,
      availableSeats: 0,
      isFull: true,
    })
    expect(summary[1].assignedSeats).toBe(1)
    expect(summary[1].availableSeats).toBe(5)
  })
})

describe('canAssignSeatToTable', () => {
  it('allows staying on same table when full', () => {
    expect(
      canAssignSeatToTable({
        targetTableId: 'table-1',
        currentTableId: 'table-1',
        assignedSeats: 8,
        capacity: 8,
      })
    ).toBe(true)
  })

  it('blocks assigning to a full table', () => {
    expect(
      canAssignSeatToTable({
        targetTableId: 'table-2',
        currentTableId: 'table-1',
        assignedSeats: 10,
        capacity: 10,
      })
    ).toBe(false)
  })
})
