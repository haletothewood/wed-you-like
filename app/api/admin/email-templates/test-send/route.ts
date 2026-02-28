import { NextResponse } from 'next/server'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { TemplateRenderer } from '@/infrastructure/email/TemplateRenderer'
import { emailSchema } from '@/application/validation/schemas'

const emailTemplateRepository = new DrizzleEmailTemplateRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

interface TemplateVariables {
  partner1_name: string
  partner2_name: string
  wedding_date: string
  wedding_time: string
  venue_name: string
  venue_address: string
  dress_code: string
  rsvp_deadline: string
  registry_url: string
  additional_info: string
  guest_name: string
  rsvp_url: string
  adults_count: number
  children_count: number
}

const getBaseUrl = (request: Request): string =>
  process.env.BASE_URL ||
  `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`

const buildVariables = (
  baseUrl: string,
  settings: Awaited<ReturnType<DrizzleWeddingSettingsRepository['get']>>
): TemplateVariables => ({
  partner1_name: settings?.partner1Name || 'Partner One',
  partner2_name: settings?.partner2Name || 'Partner Two',
  wedding_date: settings?.weddingDate || 'Wedding Date',
  wedding_time: settings?.weddingTime || 'Wedding Time',
  venue_name: settings?.venueName || 'Wedding Venue',
  venue_address: settings?.venueAddress || 'Venue Address',
  dress_code: settings?.dressCode || '',
  rsvp_deadline: settings?.rsvpDeadline || '',
  registry_url: settings?.registryUrl || '',
  additional_info: settings?.additionalInfo || '',
  guest_name: 'Test Guest',
  rsvp_url: `${baseUrl}/rsvp/test-link`,
  adults_count: 2,
  children_count: 0,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const testEmail = body.testEmail

    const emailValidation = emailSchema.safeParse(testEmail)
    if (!emailValidation.success) {
      return NextResponse.json(
        { error: emailValidation.error.errors[0]?.message || 'Invalid email' },
        { status: 400 }
      )
    }

    const baseUrl = getBaseUrl(request)
    const settings = await weddingSettingsRepository.get()
    const variables = buildVariables(baseUrl, settings)

    let subject = ''
    let htmlContent = ''

    if (body.templateId) {
      const template = await emailTemplateRepository.findById(body.templateId)
      if (!template) {
        return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
      }
      subject = template.subject
      htmlContent = template.htmlContent
    } else {
      if (!body.subject || !body.htmlContent) {
        return NextResponse.json(
          { error: 'Either templateId or both subject/htmlContent are required' },
          { status: 400 }
        )
      }
      subject = body.subject
      htmlContent = body.htmlContent
    }

    const renderedSubject = TemplateRenderer.render(subject, variables)
    const renderedHtml = TemplateRenderer.render(htmlContent, variables)

    await emailService.sendEmail({
      to: emailValidation.data,
      subject: renderedSubject,
      html: renderedHtml,
    })

    return NextResponse.json({
      success: true,
      sentTo: emailValidation.data,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    const message = error instanceof Error ? error.message : 'Failed to send test email'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
