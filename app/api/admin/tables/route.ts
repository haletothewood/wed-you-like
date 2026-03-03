import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/infrastructure/database/connection'
import { tableAssignments, tables } from '@/infrastructure/database/schema'
import { buildTableSeatingSummary } from '@/infrastructure/seating/seating'

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null
  }
  return value
}

const parseTableName = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  return trimmed
}

export async function GET() {
  try {
    const allTables = await db
      .select({
        id: tables.id,
        name: tables.name,
        tableNumber: tables.tableNumber,
        capacity: tables.capacity,
      })
      .from(tables)
      .orderBy(asc(tables.tableNumber))

    const assignments = await db
      .select({
        tableId: tableAssignments.tableId,
      })
      .from(tableAssignments)

    return NextResponse.json({
      tables: buildTableSeatingSummary(allTables, assignments),
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = parseTableName(body.name)
    const tableNumber = parsePositiveInt(body.tableNumber)
    const capacity = parsePositiveInt(body.capacity)

    if (name === null || tableNumber === null || capacity === null) {
      return NextResponse.json(
        { error: 'name is required, and tableNumber/capacity must be positive integers' },
        { status: 400 }
      )
    }

    const existing = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.tableNumber, tableNumber))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Table ${tableNumber} already exists` },
        { status: 409 }
      )
    }

    const tableId = nanoid()
    const now = new Date()

    await db.insert(tables).values({
      id: tableId,
      name,
      tableNumber,
      capacity,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json(
      {
        table: {
          id: tableId,
          name,
          tableNumber,
          capacity,
          assignedSeats: 0,
          availableSeats: capacity,
          isFull: false,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating table:', error)

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Table number already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
