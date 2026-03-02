import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleRSVPRepository } from '@/infrastructure/database/repositories/DrizzleRSVPRepository'
import { DrizzleMealOptionRepository } from '@/infrastructure/database/repositories/DrizzleMealOptionRepository'
import { DrizzleCustomQuestionRepository } from '@/infrastructure/database/repositories/DrizzleCustomQuestionRepository'
import { DrizzleMealSelectionRepository } from '@/infrastructure/database/repositories/DrizzleMealSelectionRepository'
import { DrizzleQuestionResponseRepository } from '@/infrastructure/database/repositories/DrizzleQuestionResponseRepository'
import { DrizzleGuestRepository } from '@/infrastructure/database/repositories/DrizzleGuestRepository'
import { db } from '@/infrastructure/database/connection'
import { rsvpReadRateLimiter, rsvpWriteRateLimiter } from '@/infrastructure/security/RateLimiter'
import { GetInviteByToken } from '@/application/use-cases/GetInviteByToken'
import { SubmitRSVP } from '@/application/use-cases/SubmitRSVP'
import { submitRsvpSchema } from '@/application/validation/schemas'

const inviteRepository = new DrizzleInviteRepository()
const rsvpRepository = new DrizzleRSVPRepository()
const mealOptionRepository = new DrizzleMealOptionRepository()
const customQuestionRepository = new DrizzleCustomQuestionRepository()

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const clientIp = getClientIp(request)
    const rateLimitKey = `${clientIp}:${token}:GET`
    const rateLimitResult = rsvpReadRateLimiter.check(rateLimitKey)

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfterMs ?? 0) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const getInviteByToken = new GetInviteByToken(
      inviteRepository,
      rsvpRepository,
      mealOptionRepository,
      customQuestionRepository
    )
    const invite = await getInviteByToken.execute(token)

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    return NextResponse.json({ invite })
  } catch (error) {
    console.error('Error fetching invite:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const clientIp = getClientIp(request)
    const rateLimitKey = `${clientIp}:${token}:POST`
    const rateLimitResult = rsvpWriteRateLimiter.check(rateLimitKey)

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfterMs ?? 0) / 1000)
      return NextResponse.json(
        { error: 'Too many RSVP attempts. Please try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const body = await request.json()

    const validation = submitRsvpSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message)
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const result = await db.transaction(async (tx) => {
      const submitRSVP = new SubmitRSVP(
        inviteRepository,
        new DrizzleRSVPRepository(tx),
        new DrizzleMealSelectionRepository(tx),
        new DrizzleQuestionResponseRepository(tx),
        new DrizzleGuestRepository(tx),
        mealOptionRepository,
        customQuestionRepository
      )

      return submitRSVP.execute({
        token,
        isAttending: data.isAttending,
        adultsAttending: data.adultsAttending,
        childrenAttending: data.childrenAttending,
        dietaryRequirements: data.dietaryRequirements,
        plusOneName: data.plusOneName,
        mealSelections: data.mealSelections,
        questionResponses: data.questionResponses,
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error submitting RSVP:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to submit RSVP'
    const status = message === 'Invite not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
