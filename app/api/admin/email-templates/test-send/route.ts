import { NextResponse } from 'next/server'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { ResendEmailService } from '@/infrastructure/email/ResendEmailService'
import { TemplateRenderer } from '@/infrastructure/email/TemplateRenderer'
import { emailSchema } from '@/application/validation/schemas'
import { getCampaignBaseUrl } from '../../campaigns/_shared'

const emailTemplateRepository = new DrizzleEmailTemplateRepository()
const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()
const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '')

const buildVariables = (
  baseUrl: string,
  settings: Awaited<ReturnType<DrizzleWeddingSettingsRepository['get']>>
): Record<string, string | number | undefined> => ({
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

const previewOverrideKeys = new Set([
  'partner1_name',
  'partner2_name',
  'wedding_date',
  'wedding_time',
  'venue_name',
  'venue_address',
  'dress_code',
  'rsvp_deadline',
  'registry_url',
  'additional_info',
  'guest_name',
  'rsvp_url',
  'adults_count',
  'children_count',
])

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

    const baseUrl = getCampaignBaseUrl(request)
    const settings = await weddingSettingsRepository.get()
    const variables = buildVariables(baseUrl, settings)
    const previewOverrides =
      body.previewOverrides && typeof body.previewOverrides === 'object'
        ? (body.previewOverrides as Record<string, unknown>)
        : {}

    for (const [key, value] of Object.entries(previewOverrides)) {
      if (!previewOverrideKeys.has(key)) continue
      if (value === undefined || value === null) continue
      if ((key === 'adults_count' || key === 'children_count') && typeof value !== 'number') continue
      if (key !== 'adults_count' && key !== 'children_count' && typeof value !== 'string') continue
      variables[key] = value as string | number
    }

    let subject = ''
    let htmlContent = ''
    let heroImageUrl: string | undefined

    if (body.templateId) {
      const template = await emailTemplateRepository.findById(body.templateId)
      if (!template) {
        return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
      }
      subject = template.subject
      htmlContent = template.htmlContent
      heroImageUrl = template.heroImageUrl
    } else {
      if (!body.subject || !body.htmlContent) {
        return NextResponse.json(
          { error: 'Either templateId or both subject/htmlContent are required' },
          { status: 400 }
        )
      }
      subject = body.subject
      htmlContent = body.htmlContent
      heroImageUrl = body.heroImageUrl
    }

    const renderedSubject = TemplateRenderer.render(subject, variables)
    const renderedHtml = TemplateRenderer.renderWithHeroImage(
      htmlContent,
      variables,
      heroImageUrl
    )

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
