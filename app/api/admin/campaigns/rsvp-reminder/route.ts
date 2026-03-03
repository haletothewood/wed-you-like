import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import { rsvps } from '@/infrastructure/database/schema'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { escapeHtml, getCampaignBaseUrl, withCampaignLock } from '../_shared'

const inviteRepository = new DrizzleInviteRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

interface ReminderCampaignResponse {
  success: boolean
  totalInvites: number
  eligiblePending: number
  sent: number
  skippedNotSent: number
  skippedAlreadyResponded: number
  skippedNoEmail: number
  failed: number
  errors: string[]
}

export async function POST(request: Request) {
  try {
    const result = await withCampaignLock(
      'campaign:rsvp-reminder',
      async (): Promise<ReminderCampaignResponse> => {
        const baseUrl = getCampaignBaseUrl(request)
        const invites = await inviteRepository.findAll()
        const allRsvps = await db.select({ inviteId: rsvps.inviteId }).from(rsvps)
        const respondedInviteIds = new Set(allRsvps.map((rsvp) => rsvp.inviteId))
        const weddingSettings = await weddingSettingsRepository.get()

        const coupleNames = weddingSettings
          ? `${weddingSettings.partner1Name} & ${weddingSettings.partner2Name}`
          : 'the couple'
        const escapedCoupleNames = escapeHtml(coupleNames)

        const deadlineLine = weddingSettings?.rsvpDeadline
          ? `<p>Please RSVP by <strong>${escapeHtml(weddingSettings.rsvpDeadline)}</strong>.</p>`
          : ''

        const campaignResult: ReminderCampaignResponse = {
          success: true,
          totalInvites: invites.length,
          eligiblePending: 0,
          sent: 0,
          skippedNotSent: 0,
          skippedAlreadyResponded: 0,
          skippedNoEmail: 0,
          failed: 0,
          errors: [],
        }

        for (const invite of invites) {
          if (!invite.sentAt) {
            campaignResult.skippedNotSent++
            continue
          }

          if (respondedInviteIds.has(invite.id)) {
            campaignResult.skippedAlreadyResponded++
            continue
          }

          const primaryGuest = invite.guests.find((guest) => guest.email && guest.email.trim() !== '')

          if (!primaryGuest) {
            campaignResult.skippedNoEmail++
            continue
          }

          campaignResult.eligiblePending++

          const rsvpUrl = `${baseUrl}/rsvp/${encodeURIComponent(invite.token)}`
          const escapedRsvpUrl = escapeHtml(rsvpUrl)
          const guestName = escapeHtml(invite.groupName || primaryGuest.name)

          const subject = `Reminder: RSVP for ${coupleNames}'s wedding`
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
              <h2 style="margin: 0 0 12px 0;">RSVP Reminder</h2>
              <p>Hi ${guestName},</p>
              <p>Just a quick reminder to complete your RSVP using your personal link:</p>
              ${deadlineLine}
              <p style="margin: 22px 0;">
                <a href="${escapedRsvpUrl}" style="background: #5b623f; color: #ecebe1; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block; font-weight: 600;">
                  Complete RSVP
                </a>
              </p>
              <p>If the button doesn't work, use this link:</p>
              <p><a href="${escapedRsvpUrl}" style="color: #5b623f;">${escapedRsvpUrl}</a></p>
              <p style="margin-top: 24px;">Thank you,<br/>${escapedCoupleNames}</p>
            </div>
          `

          try {
            await emailService.sendEmail({
              to: primaryGuest.email,
              subject,
              html,
            })
            campaignResult.sent++
          } catch (error) {
            campaignResult.failed++
            const message = error instanceof Error ? error.message : 'Unknown error'
            campaignResult.errors.push(`Failed for ${primaryGuest.email}: ${message}`)
          }
        }

        return campaignResult
      }
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending RSVP reminder campaign:', error)
    const message = error instanceof Error ? error.message : 'Failed to send campaign'
    const status = message === 'Campaign is already running' ? 409 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
