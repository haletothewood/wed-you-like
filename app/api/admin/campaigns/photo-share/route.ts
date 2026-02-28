import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { DrizzleEmailCampaignEventRepository } from '@/infrastructure/database/repositories/DrizzleEmailCampaignEventRepository'

const inviteRepository = new DrizzleInviteRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailCampaignEventRepository = new DrizzleEmailCampaignEventRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

interface PhotoShareCampaignResponse {
  success: boolean
  totalInvites: number
  sent: number
  skippedNoEmail: number
  failed: number
  errors: string[]
}

const getBaseUrl = (request: Request): string =>
  process.env.BASE_URL ||
  `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`

export async function POST(request: Request) {
  try {
    const baseUrl = getBaseUrl(request)
    const invites = await inviteRepository.findAll()
    const weddingSettings = await weddingSettingsRepository.get()

    const coupleNames = weddingSettings
      ? `${weddingSettings.partner1Name} & ${weddingSettings.partner2Name}`
      : 'the couple'

    const dateLabel = weddingSettings?.weddingDate || 'today'

    const result: PhotoShareCampaignResponse = {
      success: true,
      totalInvites: invites.length,
      sent: 0,
      skippedNoEmail: 0,
      failed: 0,
      errors: [],
    }

    for (const invite of invites) {
      const primaryGuest = invite.guests.find((guest) => guest.email && guest.email.trim() !== '')

      if (!primaryGuest) {
        result.skippedNoEmail++
        continue
      }

      const shareUrl = `${baseUrl}/photos/${invite.token}`
      const guestName = invite.groupName || primaryGuest.name

      const subject = `Share your photos from ${coupleNames}'s wedding`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px 0;">Photo Share Link</h2>
          <p>Hi ${guestName},</p>
          <p>We're collecting guest photos from ${dateLabel}. Please use your personal link below to upload your pictures:</p>
          <p style="margin: 22px 0;">
            <a href="${shareUrl}" style="background: #2d6cdf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block; font-weight: 600;">
              Open Photo Upload Page
            </a>
          </p>
          <p>If the button doesn't work, use this link:</p>
          <p><a href="${shareUrl}">${shareUrl}</a></p>
          <p style="margin-top: 24px;">Thank you for celebrating with us.<br/>${coupleNames}</p>
        </div>
      `

      try {
        await emailService.sendEmail({
          to: primaryGuest.email,
          subject,
          html,
        })

        await emailCampaignEventRepository.logEvent({
          eventType: 'photo_share_send',
          status: 'sent',
          inviteId: invite.id,
          recipientEmail: primaryGuest.email,
          subject,
        })

        result.sent++
      } catch (error) {
        result.failed++
        const message = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed for ${primaryGuest.email}: ${message}`)

        try {
          await emailCampaignEventRepository.logEvent({
            eventType: 'photo_share_send',
            status: 'failed',
            inviteId: invite.id,
            recipientEmail: primaryGuest.email,
            subject,
            errorMessage: message,
          })
        } catch (loggingError) {
          console.error('Failed to log photo share send failure:', loggingError)
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending photo share campaign:', error)
    const message = error instanceof Error ? error.message : 'Failed to send campaign'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
