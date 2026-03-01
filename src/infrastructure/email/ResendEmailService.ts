import { Resend } from 'resend'
import type {
  EmailService,
  EmailSendRequest,
} from '@/domain/services/EmailService'

export class ResendEmailService implements EmailService {
  private resend: Resend
  private readonly mockDelivery: boolean

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
    this.mockDelivery = process.env.MOCK_EMAIL_DELIVERY === 'true'
  }

  async sendEmail(request: EmailSendRequest): Promise<void> {
    if (this.mockDelivery) {
      console.log(`[MOCK_EMAIL_DELIVERY] Skipping email send to ${request.to}`)
      return
    }

    try {
      const result = await this.resend.emails.send({
        from: 'Wedding Couple <rsvp@yourdomain.com>',
        to: request.to,
        subject: request.subject,
        html: request.html,
      })

      // Log the response for debugging
      console.log('Resend API Response:', JSON.stringify(result, null, 2))

      // Check if the email was accepted
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`)
      }

      if (!result.data?.id) {
        throw new Error('No email ID returned from Resend')
      }

      console.log(`Email sent successfully! Resend ID: ${result.data.id}`)
    } catch (error) {
      console.error('Resend email error:', error)
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to send email: ${message}`)
    }
  }
}
