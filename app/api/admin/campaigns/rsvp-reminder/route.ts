import { NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/connection'
import { rsvps } from '@/infrastructure/database/schema'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'

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

const getBaseUrl = (request: Request): string => {
  const configuredBaseUrl = process.env.BASE_URL?.trim()

  if (configuredBaseUrl) {
    const parsed = new URL(configuredBaseUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('BASE_URL must use http or https')
    }
    return parsed.origin
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BASE_URL must be configured in production')
  }

  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${protocol}://${host}`
}

export async function POST(request: Request) {
  try {
    const baseUrl = getBaseUrl(request)
    const invites = await inviteRepository.findAll()
    const allRsvps = await db.select({ inviteId: rsvps.inviteId }).from(rsvps)
    const respondedInviteIds = new Set(allRsvps.map((rsvp) => rsvp.inviteId))
    const weddingSettings = await weddingSettingsRepository.get()

    const coupleNames = weddingSettings
      ? `${weddingSettings.partner1Name} & ${weddingSettings.partner2Name}`
      : 'the couple'

    const deadlineLine = weddingSettings?.rsvpDeadline
      ? `<p>Please RSVP by <strong>${weddingSettings.rsvpDeadline}</strong>.</p>`
      : ''

    const result: ReminderCampaignResponse = {
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
        result.skippedNotSent++
        continue
      }

      if (respondedInviteIds.has(invite.id)) {
        result.skippedAlreadyResponded++
        continue
      }

      const primaryGuest = invite.guests.find((guest) => guest.email && guest.email.trim() !== '')

      if (!primaryGuest) {
        result.skippedNoEmail++
        continue
      }

      result.eligiblePending++

      const rsvpUrl = `${baseUrl}/rsvp/${invite.token}`
      const guestName = invite.groupName || primaryGuest.name

      const subject = `Reminder: RSVP for ${coupleNames}'s wedding`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px 0;">RSVP Reminder</h2>
          <p>Hi ${guestName},</p>
          <p>Just a quick reminder to complete your RSVP using your personal link:</p>
          ${deadlineLine}
          <p style="margin: 22px 0;">
            <a href="${rsvpUrl}" style="background: #2d6cdf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block; font-weight: 600;">
              Complete RSVP
            </a>
          </p>
          <p>If the button doesn't work, use this link:</p>
          <p><a href="${rsvpUrl}">${rsvpUrl}</a></p>
          <p style="margin-top: 24px;">Thank you,<br/>${coupleNames}</p>
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

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending RSVP reminder campaign:', error)
    const message = error instanceof Error ? error.message : 'Failed to send campaign'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
