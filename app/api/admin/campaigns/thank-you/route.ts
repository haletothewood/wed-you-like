import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/infrastructure/database/connection'
import { invites as invitesTable, rsvps } from '@/infrastructure/database/schema'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { TemplateRenderer } from '@/infrastructure/email/TemplateRenderer'
import { getCampaignBaseUrl, recordCampaignRun } from '../_shared'
import { planThankYouCampaign } from '@/application/campaigns/planThankYouCampaign'

const emailTemplateRepository = new DrizzleEmailTemplateRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

interface ThankYouCampaignResponse {
  success: boolean
  totalInvites: number
  eligibleAttending: number
  sent: number
  skippedNotSent: number
  skippedNotAttending: number
  skippedAlreadyThanked: number
  skippedNoEmail: number
  failed: number
  errors: string[]
}

export async function POST(request: Request) {
  const campaignKey = 'thank-you' as const
  try {
    const baseUrl = getCampaignBaseUrl(request)

    const [invites, attendingRsvps, template, weddingSettings] = await Promise.all([
      db.query.invites.findMany({
        with: {
          guests: true,
        },
      }),
      db.select({ inviteId: rsvps.inviteId }).from(rsvps).where(eq(rsvps.isAttending, true)),
      emailTemplateRepository.findActiveByType('thank_you'),
      weddingSettingsRepository.get(),
    ])

    if (!template) {
      throw new Error(
        'No active thank-you email template found. Please create and activate a thank-you template.'
      )
    }

    if (!weddingSettings) {
      throw new Error('Wedding settings not configured. Please configure wedding settings first.')
    }

    const attendingInviteIds = new Set(attendingRsvps.map((rsvp) => rsvp.inviteId))
    const plan = planThankYouCampaign({ invites, attendingInviteIds })

    const result: ThankYouCampaignResponse = {
      success: true,
      totalInvites: invites.length,
      eligibleAttending: plan.recipients.length,
      sent: 0,
      skippedNotSent: plan.skippedNotSent,
      skippedNotAttending: plan.skippedNotAttending,
      skippedAlreadyThanked: plan.skippedAlreadyThanked,
      skippedNoEmail: plan.skippedNoEmail,
      failed: 0,
      errors: [],
    }

    for (const recipient of plan.recipients) {
      const guestLabel = recipient.groupName || recipient.guestName
      const photoShareUrl = `${baseUrl}/photos/${encodeURIComponent(recipient.token)}`
      const rsvpUrl = `${baseUrl}/rsvp/${encodeURIComponent(recipient.token)}`

      const variables: Record<string, string | number | undefined> = {
        partner1_name: weddingSettings.partner1Name,
        partner2_name: weddingSettings.partner2Name,
        wedding_date: weddingSettings.weddingDate,
        wedding_time: weddingSettings.weddingTime,
        venue_name: weddingSettings.venueName,
        venue_address: weddingSettings.venueAddress,
        dress_code: weddingSettings.dressCode,
        registry_url: weddingSettings.registryUrl,
        additional_info: weddingSettings.additionalInfo,
        guest_name: guestLabel,
        rsvp_url: rsvpUrl,
        photo_share_url: photoShareUrl,
      }

      const subject = TemplateRenderer.render(template.subject, variables)
      const html = TemplateRenderer.renderWithHeroImage(
        template.htmlContent,
        variables,
        template.heroImageUrl
      )

      try {
        await emailService.sendEmail({
          to: recipient.email,
          subject,
          html,
        })

        await db
          .update(invitesTable)
          .set({
            thankYouSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invitesTable.id, recipient.inviteId))

        result.sent++
      } catch (error) {
        result.failed++
        const message = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed for ${recipient.email}: ${message}`)
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
    console.error('Error sending thank-you campaign:', error)
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
