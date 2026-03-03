import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/infrastructure/database/connection'
import { tableAssignments, tables } from '@/infrastructure/database/schema'

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null
  }
  return value
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingTable = await db
      .select({
        id: tables.id,
        tableNumber: tables.tableNumber,
        capacity: tables.capacity,
      })
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1)

    if (existingTable.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const nextTableNumber =
      body.tableNumber === undefined
        ? existingTable[0].tableNumber
        : parsePositiveInt(body.tableNumber)
    const nextCapacity =
      body.capacity === undefined ? existingTable[0].capacity : parsePositiveInt(body.capacity)

    if (nextTableNumber === null || nextCapacity === null) {
      return NextResponse.json(
        { error: 'tableNumber and capacity must be positive integers' },
        { status: 400 }
      )
    }

    const assignedSeatRows = await db
      .select({ guestId: tableAssignments.guestId })
      .from(tableAssignments)
      .where(eq(tableAssignments.tableId, id))
    const assignedSeats = assignedSeatRows.length

    if (nextCapacity < assignedSeats) {
      return NextResponse.json(
        {
          error: `Cannot reduce capacity below current assigned seats (${assignedSeats})`,
        },
        { status: 409 }
      )
    }

    if (nextTableNumber !== existingTable[0].tableNumber) {
      const conflict = await db
        .select({ id: tables.id })
        .from(tables)
        .where(eq(tables.tableNumber, nextTableNumber))
        .limit(1)

      if (conflict.length > 0) {
        return NextResponse.json(
          { error: `Table ${nextTableNumber} already exists` },
          { status: 409 }
        )
      }
    }

    await db
      .update(tables)
      .set({
        tableNumber: nextTableNumber,
        capacity: nextCapacity,
        updatedAt: new Date(),
      })
      .where(eq(tables.id, id))

    return NextResponse.json({
      table: {
        id,
        tableNumber: nextTableNumber,
        capacity: nextCapacity,
        assignedSeats,
        availableSeats: Math.max(nextCapacity - assignedSeats, 0),
        isFull: assignedSeats >= nextCapacity,
      },
    })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    await db.delete(tables).where(eq(tables.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
