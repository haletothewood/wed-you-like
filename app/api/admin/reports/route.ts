import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import {
  invites,
  mealOptions,
  mealSelections,
  rsvps,
  tableAssignments,
  tables,
} from '@/infrastructure/database/schema'
import { asc, eq, isNotNull } from 'drizzle-orm'
import { buildTableSeatingSummary } from '@/infrastructure/seating/seating'
import { getCampaignRunSummaries } from '../campaigns/_shared'

export async function GET() {
  try {
    const [
      allInvites,
      sentInvites,
      allRsvps,
      allTables,
      allTableAssignments,
      campaignRuns,
    ] = await Promise.all([
      db.select().from(invites),
      db.select().from(invites).where(isNotNull(invites.sentAt)),
      db.select().from(rsvps),
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
          tableId: tableAssignments.tableId,
        })
        .from(tableAssignments),
      getCampaignRunSummaries([
        'rsvp-reminder',
        'rsvp-completion',
        'thank-you',
        'photo-share',
      ]),
    ])

    // Get attending RSVPs
    const attendingRsvps = allRsvps.filter(rsvp => rsvp.isAttending)
    const notAttendingRsvps = allRsvps.filter(rsvp => !rsvp.isAttending)

    // Calculate total guests attending
    const totalGuestsAttending = attendingRsvps.reduce(
      (sum, rsvp) => sum + rsvp.adultsAttending + rsvp.childrenAttending,
      0
    )

    // Get all meal selections with meal option details
    const allMealSelections = await db
      .select({
        id: mealSelections.id,
        guestId: mealSelections.guestId,
        mealOptionId: mealSelections.mealOptionId,
        courseType: mealSelections.courseType,
        mealOptionName: mealOptions.name,
        mealOptionCourseType: mealOptions.courseType,
        mealOptionDescription: mealOptions.description,
      })
      .from(mealSelections)
      .leftJoin(mealOptions, eq(mealSelections.mealOptionId, mealOptions.id))

    // Group meal selections by meal option
    const mealCounts = allMealSelections.reduce((acc, selection) => {
      const key = selection.mealOptionId
      if (!acc[key]) {
        acc[key] = {
          mealOptionId: selection.mealOptionId,
          name: selection.mealOptionName || 'Unknown',
          courseType: selection.mealOptionCourseType || 'MAIN',
          description: selection.mealOptionDescription,
          count: 0,
        }
      }
      acc[key].count++
      return acc
    }, {} as Record<string, { mealOptionId: string; name: string; courseType: string; description: string | null; count: number }>)

    // Group by course type
    const mealCountsByCourse = {
      STARTER: [] as Array<{ name: string; description: string | null; count: number }>,
      MAIN: [] as Array<{ name: string; description: string | null; count: number }>,
      DESSERT: [] as Array<{ name: string; description: string | null; count: number }>,
    }

    Object.values(mealCounts).forEach((item) => {
      if (item.courseType === 'STARTER') {
        mealCountsByCourse.STARTER.push({ name: item.name, description: item.description, count: item.count })
      } else if (item.courseType === 'MAIN') {
        mealCountsByCourse.MAIN.push({ name: item.name, description: item.description, count: item.count })
      } else if (item.courseType === 'DESSERT') {
        mealCountsByCourse.DESSERT.push({ name: item.name, description: item.description, count: item.count })
      }
    })

    return NextResponse.json({
      overview: {
        totalInvites: allInvites.length,
        invitesSent: sentInvites.length,
        totalRsvps: allRsvps.length,
        attending: attendingRsvps.length,
        notAttending: notAttendingRsvps.length,
        totalGuestsAttending,
      },
      mealCounts: mealCountsByCourse,
      seatingSummary: buildTableSeatingSummary(allTables, allTableAssignments),
      campaignRuns,
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
