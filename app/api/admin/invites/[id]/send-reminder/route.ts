import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/infrastructure/database/connection'
import { rsvps } from '@/infrastructure/database/schema'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { escapeHtml, getCampaignBaseUrl } from '../../../campaigns/_shared'

const inviteRepository = new DrizzleInviteRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [invite, existingRsvp, weddingSettings] = await Promise.all([
      inviteRepository.findById(id),
      db.select({ id: rsvps.id }).from(rsvps).where(eq(rsvps.inviteId, id)).limit(1),
      weddingSettingsRepository.get(),
    ])

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (!invite.sentAt) {
      return NextResponse.json(
        { error: 'Invite email has not been sent yet' },
        { status: 400 }
      )
    }

    if (existingRsvp.length > 0) {
      return NextResponse.json(
        { error: 'Invite already responded; no reminder needed' },
        { status: 400 }
      )
    }

    const primaryGuest = invite.guests.find((guest) => guest.email && guest.email.trim() !== '')
    if (!primaryGuest) {
      return NextResponse.json(
        { error: 'Invite has no guest with an email address' },
        { status: 400 }
      )
    }

    const baseUrl = getCampaignBaseUrl(request)
    const coupleNames = weddingSettings
      ? `${weddingSettings.partner1Name} & ${weddingSettings.partner2Name}`
      : 'the couple'
    const escapedCoupleNames = escapeHtml(coupleNames)

    const deadlineLine = weddingSettings?.rsvpDeadline
      ? `<p>Please RSVP by <strong>${escapeHtml(weddingSettings.rsvpDeadline)}</strong>.</p>`
      : ''

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
          <a href="${escapedRsvpUrl}" style="background: #2d6cdf; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block; font-weight: 600;">
            Complete RSVP
          </a>
        </p>
        <p>If the button doesn't work, use this link:</p>
        <p><a href="${escapedRsvpUrl}">${escapedRsvpUrl}</a></p>
        <p style="margin-top: 24px;">Thank you,<br/>${escapedCoupleNames}</p>
      </div>
    `

    await emailService.sendEmail({
      to: primaryGuest.email,
      subject,
      html,
    })

    return NextResponse.json({
      success: true,
      sentTo: primaryGuest.email,
    })
  } catch (error) {
    console.error('Error sending reminder email:', error)
    const message = error instanceof Error ? error.message : 'Failed to send reminder email'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
