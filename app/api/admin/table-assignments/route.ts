import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/infrastructure/database/connection'
import { guests, invites, rsvps, tableAssignments, tables } from '@/infrastructure/database/schema'
import {
  buildTableSeatingSummary,
  canAssignSeatToTable,
  getGuestTypeLabel,
} from '@/infrastructure/seating/seating'

const isValidOptionalTableId = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

export async function GET() {
  try {
    const [allTables, assignments, attendingGuests] = await Promise.all([
      db
        .select({
          id: tables.id,
          name: tables.name,
          tableNumber: tables.tableNumber,
          capacity: tables.capacity,
        })
        .from(tables)
        .orderBy(asc(tables.tableNumber)),
      db
        .select({
          guestId: tableAssignments.guestId,
          tableId: tableAssignments.tableId,
          tableName: tables.name,
          tableNumber: tables.tableNumber,
        })
        .from(tableAssignments)
        .leftJoin(tables, eq(tableAssignments.tableId, tables.id)),
      db
        .select({
          id: guests.id,
          name: guests.name,
          isPlusOne: guests.isPlusOne,
          isChild: guests.isChild,
          inviteId: invites.id,
          inviteGroupName: invites.groupName,
        })
        .from(guests)
        .innerJoin(invites, eq(guests.inviteId, invites.id))
        .innerJoin(rsvps, and(eq(rsvps.inviteId, invites.id), eq(rsvps.isAttending, true)))
        .orderBy(asc(invites.groupName), asc(guests.name)),
    ])

    const assignmentByGuestId = new Map(assignments.map((assignment) => [assignment.guestId, assignment]))

    return NextResponse.json({
      tables: buildTableSeatingSummary(
        allTables,
        assignments.map((assignment) => ({ tableId: assignment.tableId }))
      ),
      guests: attendingGuests.map((guest) => {
        const assignment = assignmentByGuestId.get(guest.id)
        return {
          id: guest.id,
          name: guest.name,
          inviteId: guest.inviteId,
          inviteGroupName: guest.inviteGroupName,
          isPlusOne: guest.isPlusOne,
          isChild: guest.isChild,
          guestType: getGuestTypeLabel({
            isChild: guest.isChild,
            isPlusOne: guest.isPlusOne,
          }),
          tableId: assignment?.tableId ?? null,
          tableName: assignment?.tableName ?? null,
          tableNumber: assignment?.tableNumber ?? null,
        }
      }),
    })
  } catch (error) {
    console.error('Error fetching table assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch table assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const guestId = typeof body.guestId === 'string' ? body.guestId : null
    const tableId = isValidOptionalTableId(body.tableId) ? body.tableId : undefined

    if (!guestId || tableId === undefined) {
      return NextResponse.json(
        { error: 'guestId must be a string and tableId must be a string or null' },
        { status: 400 }
      )
    }

    const attendingGuest = await db
      .select({
        id: guests.id,
        name: guests.name,
      })
      .from(guests)
      .innerJoin(invites, eq(guests.inviteId, invites.id))
      .innerJoin(rsvps, and(eq(rsvps.inviteId, invites.id), eq(rsvps.isAttending, true)))
      .where(eq(guests.id, guestId))
      .limit(1)

    if (attendingGuest.length === 0) {
      return NextResponse.json(
        { error: 'Guest must belong to an attending RSVP before seating assignment' },
        { status: 400 }
      )
    }

    const currentAssignment = await db
      .select({
        id: tableAssignments.id,
        tableId: tableAssignments.tableId,
      })
      .from(tableAssignments)
      .where(eq(tableAssignments.guestId, guestId))
      .limit(1)

    if (tableId === null) {
      await db.delete(tableAssignments).where(eq(tableAssignments.guestId, guestId))
      return NextResponse.json({ success: true, assignment: null })
    }

    const targetTableRows = await db
      .select({
        id: tables.id,
        name: tables.name,
        tableNumber: tables.tableNumber,
        capacity: tables.capacity,
      })
      .from(tables)
      .where(eq(tables.id, tableId))
      .limit(1)

    if (targetTableRows.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const targetTable = targetTableRows[0]

    if (currentAssignment[0]?.tableId === tableId) {
      return NextResponse.json({
        success: true,
        assignment: {
          guestId,
          tableId,
          tableName: targetTable.name,
          tableNumber: targetTable.tableNumber,
        },
      })
    }

    const seatAssignments = await db
      .select({
        tableId: tableAssignments.tableId,
      })
      .from(tableAssignments)
      .where(eq(tableAssignments.tableId, tableId))

    const canAssign = canAssignSeatToTable({
      targetTableId: tableId,
      currentTableId: currentAssignment[0]?.tableId,
      assignedSeats: seatAssignments.length,
      capacity: targetTable.capacity,
    })

    if (!canAssign) {
      const tableLabel =
        targetTable.name && targetTable.name.trim() !== ''
          ? `${targetTable.name} (Table ${targetTable.tableNumber})`
          : `Table ${targetTable.tableNumber}`
      return NextResponse.json(
        {
          error: `${tableLabel} is at capacity (${targetTable.capacity})`,
        },
        { status: 409 }
      )
    }

    await db.transaction(async (tx) => {
      if (currentAssignment.length > 0) {
        await tx.delete(tableAssignments).where(eq(tableAssignments.guestId, guestId))
      }

      await tx.insert(tableAssignments).values({
        id: nanoid(),
        guestId,
        tableId,
        createdAt: new Date(),
      })
    })

    return NextResponse.json({
      success: true,
      assignment: {
        guestId,
        tableId,
        tableName: targetTable.name,
        tableNumber: targetTable.tableNumber,
      },
    })
  } catch (error) {
    console.error('Error assigning guest to table:', error)
    return NextResponse.json({ error: 'Failed to assign guest to table' }, { status: 500 })
  }
}
