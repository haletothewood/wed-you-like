import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleRSVPRepository } from '@/infrastructure/database/repositories/DrizzleRSVPRepository'
import { DrizzleMealOptionRepository } from '@/infrastructure/database/repositories/DrizzleMealOptionRepository'
import { DrizzleCustomQuestionRepository } from '@/infrastructure/database/repositories/DrizzleCustomQuestionRepository'
import { DrizzleMealSelectionRepository } from '@/infrastructure/database/repositories/DrizzleMealSelectionRepository'
import { DrizzleQuestionResponseRepository } from '@/infrastructure/database/repositories/DrizzleQuestionResponseRepository'
import { CreateIndividualInvite } from '@/application/use-cases/CreateIndividualInvite'
import { CreateGroupInvite } from '@/application/use-cases/CreateGroupInvite'
import { GetAllInvites } from '@/application/use-cases/GetAllInvites'
import { createInviteSchema } from '@/application/validation/schemas'

const inviteRepository = new DrizzleInviteRepository()
const rsvpRepository = new DrizzleRSVPRepository()
const mealOptionRepository = new DrizzleMealOptionRepository()
const customQuestionRepository = new DrizzleCustomQuestionRepository()
const mealSelectionRepository = new DrizzleMealSelectionRepository()
const questionResponseRepository = new DrizzleQuestionResponseRepository()

export async function GET() {
  try {
    const getAllInvites = new GetAllInvites(
      inviteRepository,
      rsvpRepository,
      mealOptionRepository,
      customQuestionRepository,
      mealSelectionRepository,
      questionResponseRepository
    )
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

    const validation = createInviteSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const data = validation.data

    if (data.type === 'individual') {
      const createInvite = new CreateIndividualInvite(inviteRepository)
      const result = await createInvite.execute({
        guestName: data.guestName,
        email: data.email,
        phone: data.phone,
        plusOneAllowed: data.plusOneAllowed,
      })

      return NextResponse.json(result, { status: 201 })
    } else {
      const createGroupInvite = new CreateGroupInvite(inviteRepository)
      const result = await createGroupInvite.execute({
          groupName: data.groupName,
          guests: data.guests,
        })

      return NextResponse.json(result, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating invite:', error)
    const message = error instanceof Error ? error.message : 'Failed to create invite'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
