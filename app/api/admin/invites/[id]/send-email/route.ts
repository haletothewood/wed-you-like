import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { SendInviteEmail } from '@/application/use-cases/SendInviteEmail'
import { DrizzleEmailCampaignEventRepository } from '@/infrastructure/database/repositories/DrizzleEmailCampaignEventRepository'

const inviteRepository = new DrizzleInviteRepository()
const emailTemplateRepository = new DrizzleEmailTemplateRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailCampaignEventRepository = new DrizzleEmailCampaignEventRepository()
const emailService = new ResendEmailService(
  process.env.RESEND_API_KEY || ''
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let inviteIdForLog: string | undefined
  let recipientEmailForLog: string | undefined
  let templateIdForLog: string | undefined
  let subjectForLog: string | undefined

  try {
    const { id } = await params
    inviteIdForLog = id

    const invite = await inviteRepository.findById(id)
    const primaryGuest = invite?.guests.find((guest) => guest.email && guest.email.trim())
    recipientEmailForLog = primaryGuest?.email

    const activeTemplate = await emailTemplateRepository.findActiveByType('invite')
    templateIdForLog = activeTemplate?.id
    subjectForLog = activeTemplate?.subject

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

    if (result.sentTo) {
      await emailCampaignEventRepository.logEvent({
        eventType: 'invite_send',
        status: 'sent',
        templateId: templateIdForLog,
        inviteId: inviteIdForLog,
        recipientEmail: result.sentTo,
        subject: subjectForLog,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending invite email:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to send invite email'

    if (recipientEmailForLog) {
      try {
        await emailCampaignEventRepository.logEvent({
          eventType: 'invite_send',
          status: 'failed',
          templateId: templateIdForLog,
          inviteId: inviteIdForLog,
          recipientEmail: recipientEmailForLog,
          subject: subjectForLog,
          errorMessage: message,
        })
      } catch (loggingError) {
        console.error('Failed to log invite send failure:', loggingError)
      }
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
