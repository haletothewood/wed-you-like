import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import { rsvps, mealSelections, mealOptions } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    // Get all invites with their guests
    const allInvites = await db.query.invites.findMany({
      with: {
        guests: true,
      },
    })

    // Get all RSVPs
    const allRsvps = await db.select().from(rsvps)

    // Get all meal selections with meal option details
    const allMealSelections = await db
      .select({
        guestId: mealSelections.guestId,
        courseType: mealSelections.courseType,
        mealOptionName: mealOptions.name,
      })
      .from(mealSelections)
      .leftJoin(mealOptions, eq(mealSelections.mealOptionId, mealOptions.id))

    // Build guest list with meal selections
    const rows: string[] = []
    rows.push('Guest Name,Email,Group,RSVP Status,Attending,Starter,Main Course,Dessert')

    for (const invite of allInvites) {
      const rsvp = allRsvps.find(r => r.inviteId === invite.id)
      const rsvpStatus = rsvp ? 'Responded' : 'No Response'
      const attending = rsvp?.isAttending ? 'Yes' : 'No'

      for (const guest of invite.guests) {
        const guestMealSelections = allMealSelections.filter(ms => ms.guestId === guest.id)
        const starter = guestMealSelections.find(ms => ms.courseType === 'STARTER')?.mealOptionName || ''
        const main = guestMealSelections.find(ms => ms.courseType === 'MAIN')?.mealOptionName || ''
        const dessert = guestMealSelections.find(ms => ms.courseType === 'DESSERT')?.mealOptionName || ''

        const row = [
          `"${guest.name}"`,
          `"${guest.email}"`,
          `"${invite.groupName || ''}"`,
          rsvpStatus,
          attending,
          `"${starter}"`,
          `"${main}"`,
          `"${dessert}"`,
        ].join(',')

        rows.push(row)
      }
    }

    const csv = rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="guest-list-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting guest list:', error)
    return NextResponse.json(
      { error: 'Failed to export guest list' },
      { status: 500 }
    )
  }
}
