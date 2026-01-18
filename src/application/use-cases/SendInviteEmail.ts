import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { EmailTemplateRepository } from '@/domain/repositories/EmailTemplateRepository'
import type { WeddingSettingsRepository } from '@/domain/repositories/WeddingSettingsRepository'
import type { EmailService } from '@/domain/services/EmailService'
import { TemplateRenderer } from '@/infrastructure/email/TemplateRenderer'

interface SendInviteEmailInput {
  inviteId: string
  baseUrl: string
}

interface SendInviteEmailOutput {
  success: true
  sentTo: string
}

export class SendInviteEmail {
  constructor(
    private inviteRepository: InviteRepository,
    private emailTemplateRepository: EmailTemplateRepository,
    private weddingSettingsRepository: WeddingSettingsRepository,
    private emailService: EmailService
  ) {}

  async execute(input: SendInviteEmailInput): Promise<SendInviteEmailOutput> {
    const invite = await this.inviteRepository.findById(input.inviteId)

    if (!invite) {
      throw new Error('Invite not found')
    }

    const primaryGuest = invite.guests.find((g) => g.email && g.email.trim())
    if (!primaryGuest) {
      throw new Error('Invite has no guest with an email address')
    }

    const weddingSettings = await this.weddingSettingsRepository.get()
    if (!weddingSettings) {
      throw new Error('Wedding settings not configured. Please configure wedding settings first.')
    }

    const template = await this.emailTemplateRepository.findActiveByType('invite')
    if (!template) {
      throw new Error('No active invite email template found. Please create and activate an email template.')
    }

    const rsvpUrl = `${input.baseUrl}/rsvp/${invite.token}`

    const guestName = invite.groupName || primaryGuest.name

    const variables: Record<string, string | number | undefined> = {
      partner1_name: weddingSettings.partner1Name,
      partner2_name: weddingSettings.partner2Name,
      wedding_date: weddingSettings.weddingDate,
      wedding_time: weddingSettings.weddingTime,
      venue_name: weddingSettings.venueName,
      venue_address: weddingSettings.venueAddress,
      dress_code: weddingSettings.dressCode,
      rsvp_deadline: weddingSettings.rsvpDeadline,
      registry_url: weddingSettings.registryUrl,
      additional_info: weddingSettings.additionalInfo,
      guest_name: guestName,
      rsvp_url: rsvpUrl,
      adults_count: invite.adultsCount,
      children_count: invite.childrenCount,
    }

    const renderedSubject = TemplateRenderer.render(template.subject, variables)
    const renderedHtml = TemplateRenderer.render(template.htmlContent, variables)

    await this.emailService.sendEmail({
      to: primaryGuest.email,
      subject: renderedSubject,
      html: renderedHtml,
    })

    invite.markAsSent()
    await this.inviteRepository.save(invite)

    return {
      success: true,
      sentTo: primaryGuest.email,
    }
  }
}
