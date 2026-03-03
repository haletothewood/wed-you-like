import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import {
  rsvps,
  mealSelections,
  mealOptions,
  tableAssignments,
  tables,
} from '@/infrastructure/database/schema'
import { toCsvRow } from '@/infrastructure/csv/serialize'
import { eq } from 'drizzle-orm'
import { getGuestTypeLabel } from '@/infrastructure/seating/seating'

export async function GET() {
  try {
    const allInvites = await db.query.invites.findMany({
      with: {
        guests: true,
      },
    })

    const allRsvps = await db.select().from(rsvps)

    const allMealSelections = await db
      .select({
        guestId: mealSelections.guestId,
        courseType: mealSelections.courseType,
        mealOptionName: mealOptions.name,
      })
      .from(mealSelections)
      .leftJoin(mealOptions, eq(mealSelections.mealOptionId, mealOptions.id))

    const allTableAssignments = await db
      .select({
        guestId: tableAssignments.guestId,
        tableNumber: tables.tableNumber,
      })
      .from(tableAssignments)
      .leftJoin(tables, eq(tableAssignments.tableId, tables.id))

    const rows: string[] = []
    rows.push(toCsvRow(['Guest Name', 'Guest Type', 'Table', 'Starter', 'Main Course', 'Dessert']))

    const mealCounts: Record<string, { name: string; courseType: string; count: number }> = {}
    const tableAssignmentsByGuestId = new Map(
      allTableAssignments.map((assignment) => [assignment.guestId, assignment.tableNumber])
    )
    const mealSelectionsByGuestId = new Map<string, Array<typeof allMealSelections[number]>>()

    for (const selection of allMealSelections) {
      const existing = mealSelectionsByGuestId.get(selection.guestId) ?? []
      existing.push(selection)
      mealSelectionsByGuestId.set(selection.guestId, existing)
    }

    for (const invite of allInvites) {
      const rsvp = allRsvps.find((r) => r.inviteId === invite.id)

      if (!rsvp?.isAttending) continue

      for (const guest of invite.guests) {
        const guestMeals = mealSelectionsByGuestId.get(guest.id) ?? []
        const starter = guestMeals.find((ms) => ms.courseType === 'STARTER')?.mealOptionName || ''
        const main = guestMeals.find((ms) => ms.courseType === 'MAIN')?.mealOptionName || ''
        const dessert = guestMeals.find((ms) => ms.courseType === 'DESSERT')?.mealOptionName || ''

        const assignedTableNumber = tableAssignmentsByGuestId.get(guest.id)
        const tableNumber = assignedTableNumber ? `Table ${assignedTableNumber}` : 'Unassigned'
        const guestType = getGuestTypeLabel({
          isChild: guest.isChild,
          isPlusOne: guest.isPlusOne,
        })

        rows.push(toCsvRow([guest.name, guestType, tableNumber, starter, main, dessert]))

        if (starter) {
          const key = `STARTER:${starter}`
          if (!mealCounts[key]) mealCounts[key] = { name: starter, courseType: 'STARTER', count: 0 }
          mealCounts[key].count++
        }
        if (main) {
          const key = `MAIN:${main}`
          if (!mealCounts[key]) mealCounts[key] = { name: main, courseType: 'MAIN', count: 0 }
          mealCounts[key].count++
        }
        if (dessert) {
          const key = `DESSERT:${dessert}`
          if (!mealCounts[key]) mealCounts[key] = { name: dessert, courseType: 'DESSERT', count: 0 }
          mealCounts[key].count++
        }
      }
    }

    rows.push('')
    rows.push(toCsvRow(['MEAL COUNTS SUMMARY']))
    rows.push(toCsvRow(['Course', 'Meal Option', 'Count']))

    const courseOrder = { STARTER: 1, MAIN: 2, DESSERT: 3 }
    const sortedMeals = Object.values(mealCounts).sort((a, b) => {
      const orderDiff =
        courseOrder[a.courseType as keyof typeof courseOrder] -
        courseOrder[b.courseType as keyof typeof courseOrder]
      if (orderDiff !== 0) return orderDiff
      return b.count - a.count
    })

    for (const meal of sortedMeals) {
      const courseLabel =
        meal.courseType === 'STARTER'
          ? 'Starter'
          : meal.courseType === 'MAIN'
            ? 'Main'
            : 'Dessert'
      rows.push(toCsvRow([courseLabel, meal.name, meal.count]))
    }

    const csv = rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="venue-guest-meals-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting guest list:', error)
    return NextResponse.json({ error: 'Failed to export guest list' }, { status: 500 })
  }
}
