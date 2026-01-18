import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleRSVPRepository } from '@/infrastructure/database/repositories/DrizzleRSVPRepository'
import { CreateIndividualInvite } from '@/application/use-cases/CreateIndividualInvite'
import { CreateGroupInvite } from '@/application/use-cases/CreateGroupInvite'
import { GetAllInvites } from '@/application/use-cases/GetAllInvites'

const inviteRepository = new DrizzleInviteRepository()
const rsvpRepository = new DrizzleRSVPRepository()

export async function GET() {
  try {
    const getAllInvites = new GetAllInvites(inviteRepository, rsvpRepository)
    const invites = await getAllInvites.execute()

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request type
    if (!body.type || !['individual', 'group'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid or missing invite type' },
        { status: 400 }
      )
    }

    if (body.type === 'individual') {
      const createInvite = new CreateIndividualInvite(inviteRepository)
      const result = await createInvite.execute({
        guestName: body.guestName,
        email: body.email,
        plusOneAllowed: body.plusOneAllowed,
      })

      return NextResponse.json(result, { status: 201 })
    } else {
      const createGroupInvite = new CreateGroupInvite(inviteRepository)
      const result = await createGroupInvite.execute({
        groupName: body.groupName,
        adultsCount: body.adultsCount,
        childrenCount: body.childrenCount,
        guests: body.guests,
      })

      return NextResponse.json(result, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating invite:', error)
    const message = error instanceof Error ? error.message : 'Failed to create invite'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
