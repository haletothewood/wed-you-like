import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { SendInviteEmail } from '@/application/use-cases/SendInviteEmail'

const inviteRepository = new DrizzleInviteRepository()
const emailTemplateRepository = new DrizzleEmailTemplateRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(
  process.env.RESEND_API_KEY || ''
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use BASE_URL from environment variables for production
    // Falls back to constructing from headers for development
    const baseUrl =
      process.env.BASE_URL ||
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`

    const sendInviteEmail = new SendInviteEmail(
      inviteRepository,
      emailTemplateRepository,
      weddingSettingsRepository,
      emailService
    )

    const result = await sendInviteEmail.execute({
      inviteId: id,
      baseUrl,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending invite email:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to send invite email'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
