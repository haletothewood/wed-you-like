import { NextResponse } from 'next/server'
import { GetAllInvites } from '@/application/use-cases/GetAllInvites'
import { planRsvpCompletionCampaign } from '@/application/campaigns/planRsvpCompletionCampaign'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'
import { DrizzleRSVPRepository } from '@/infrastructure/database/repositories/DrizzleRSVPRepository'
import { DrizzleMealOptionRepository } from '@/infrastructure/database/repositories/DrizzleMealOptionRepository'
import { DrizzleCustomQuestionRepository } from '@/infrastructure/database/repositories/DrizzleCustomQuestionRepository'
import { DrizzleMealSelectionRepository } from '@/infrastructure/database/repositories/DrizzleMealSelectionRepository'
import { DrizzleQuestionResponseRepository } from '@/infrastructure/database/repositories/DrizzleQuestionResponseRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { escapeHtml, getCampaignBaseUrl, recordCampaignRun } from '../_shared'

const inviteRepository = new DrizzleInviteRepository()
const rsvpRepository = new DrizzleRSVPRepository()
const mealOptionRepository = new DrizzleMealOptionRepository()
const customQuestionRepository = new DrizzleCustomQuestionRepository()
const mealSelectionRepository = new DrizzleMealSelectionRepository()
const questionResponseRepository = new DrizzleQuestionResponseRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

interface CompletionCampaignResponse {
  success: boolean
  totalInvites: number
  eligibleIncompleteAttending: number
  sent: number
  skippedNotSent: number
  skippedPending: number
  skippedNotAttending: number
  skippedComplete: number
  skippedNoEmail: number
  failed: number
  errors: string[]
}

export async function POST(request: Request) {
  const campaignKey = 'rsvp-completion' as const
  try {
    const baseUrl = getCampaignBaseUrl(request)
    const [invites, weddingSettings] = await Promise.all([
      new GetAllInvites(
        inviteRepository,
        rsvpRepository,
        mealOptionRepository,
        customQuestionRepository,
        mealSelectionRepository,
        questionResponseRepository
      ).execute(),
      weddingSettingsRepository.get(),
    ])

    const coupleNames = weddingSettings
      ? `${weddingSettings.partner1Name} & ${weddingSettings.partner2Name}`
      : 'the couple'
    const escapedCoupleNames = escapeHtml(coupleNames)
    const deadlineLine = weddingSettings?.rsvpDeadline
      ? `<p>Please update your RSVP by <strong>${escapeHtml(weddingSettings.rsvpDeadline)}</strong>.</p>`
      : ''

    const plan = planRsvpCompletionCampaign({ invites })
    const result: CompletionCampaignResponse = {
      success: true,
      totalInvites: invites.length,
      eligibleIncompleteAttending: plan.recipients.length,
      sent: 0,
      skippedNotSent: plan.skippedNotSent,
      skippedPending: plan.skippedPending,
      skippedNotAttending: plan.skippedNotAttending,
      skippedComplete: plan.skippedComplete,
      skippedNoEmail: plan.skippedNoEmail,
      failed: 0,
      errors: [],
    }

    for (const recipient of plan.recipients) {
      const rsvpUrl = `${baseUrl}/rsvp/${encodeURIComponent(recipient.token)}`
      const escapedRsvpUrl = escapeHtml(rsvpUrl)
      const guestName = escapeHtml(recipient.groupName || recipient.guestName)

      const subject = `Please update your RSVP details for ${coupleNames}'s wedding`
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
          <h2 style="margin: 0 0 12px 0;">Complete Your RSVP Details</h2>
          <p>Hi ${guestName},</p>
          <p>Thank you for already replying. We're now ready for meal choices and any remaining wedding details.</p>
          <p>Please use your same personal RSVP link to update your response:</p>
          ${deadlineLine}
          <p style="margin: 22px 0;">
            <a href="${escapedRsvpUrl}" style="background: #5b623f; color: #ecebe1; text-decoration: none; padding: 12px 22px; border-radius: 8px; display: inline-block; font-weight: 600;">
              Update RSVP
            </a>
          </p>
          <p>If the button doesn't work, use this link:</p>
          <p><a href="${escapedRsvpUrl}" style="color: #5b623f;">${escapedRsvpUrl}</a></p>
          <p style="margin-top: 24px;">Thank you,<br/>${escapedCoupleNames}</p>
        </div>
      `

      try {
        await emailService.sendEmail({
          to: recipient.email,
          subject,
          html,
        })
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
    console.error('Error sending RSVP completion campaign:', error)
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
