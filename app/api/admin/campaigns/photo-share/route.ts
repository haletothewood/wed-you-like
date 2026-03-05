import { NextResponse } from 'next/server'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { escapeHtml, getCampaignBaseUrl, recordCampaignRun } from '../_shared'

const inviteRepository = new DrizzleInviteRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

interface PhotoShareCampaignResponse {
  success: boolean
  totalInvites: number
  sent: number
  skippedNoEmail: number
  failed: number
  errors: string[]
}

export async function POST(request: Request) {
  const campaignKey = 'photo-share' as const
  try {
    const baseUrl = getCampaignBaseUrl(request)
    const invites = await inviteRepository.findAll()
    const weddingSettings = await weddingSettingsRepository.get()

    const coupleNames = weddingSettings
      ? `${weddingSettings.partner1Name} & ${weddingSettings.partner2Name}`
      : 'the couple'
    const escapedCoupleNames = escapeHtml(coupleNames)

    const dateLabel = escapeHtml(weddingSettings?.weddingDate || 'today')

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

      const shareUrl = `${baseUrl}/photos/${encodeURIComponent(invite.token)}`
      const escapedShareUrl = escapeHtml(shareUrl)
      const guestName = escapeHtml(invite.groupName || primaryGuest.name)

      const subject = `Share your photos from ${coupleNames}'s wedding`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px 0;">Photo Share Link</h2>
          <p>Hi ${guestName},</p>
          <p>We're collecting guest photos from ${dateLabel}. Please use your personal link below to upload your pictures:</p>
          <p style="margin: 22px 0;">
            <a href="${escapedShareUrl}" style="background: #5b623f; color: #ecebe1; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block; font-weight: 600;">
              Open Photo Upload Page
            </a>
          </p>
          <p>If the button doesn't work, use this link:</p>
          <p><a href="${escapedShareUrl}" style="color: #5b623f;">${escapedShareUrl}</a></p>
          <p style="margin-top: 24px;">Thank you for celebrating with us.<br/>${escapedCoupleNames}</p>
        </div>
      `

      try {
        await emailService.sendEmail({
          to: primaryGuest.email,
          subject,
          html,
        })
        result.sent++
      } catch (error) {
        result.failed++
        const message = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed for ${primaryGuest.email}: ${message}`)
      }
    }

    const status =
      result.failed === 0 ? 'success' : result.sent > 0 ? 'partial' : 'failed'
    await recordCampaignRun({
      campaignKey,
      status,
      sent: result.sent,
      failed: result.failed,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending photo share campaign:', error)
    await recordCampaignRun({
      campaignKey,
      status: 'failed',
      sent: 0,
      failed: 0,
    }).catch(() => undefined)
    const message = error instanceof Error ? error.message : 'Failed to send campaign'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
