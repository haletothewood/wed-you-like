import { NextResponse } from 'next/server'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { GetAllEmailTemplates } from '@/application/use-cases/GetAllEmailTemplates'
import { CreateEmailTemplate } from '@/application/use-cases/CreateEmailTemplate'

const emailTemplateRepository = new DrizzleEmailTemplateRepository()

export async function GET() {
  try {
    const getAllTemplates = new GetAllEmailTemplates(emailTemplateRepository)
    const templates = await getAllTemplates.execute()

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        templateType: t.templateType,
        subject: t.subject,
        htmlContent: t.htmlContent,
        heroImageUrl: t.heroImageUrl,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const createTemplate = new CreateEmailTemplate(emailTemplateRepository)
    const result = await createTemplate.execute({
      name: body.name,
      templateType: body.templateType,
      subject: body.subject,
      htmlContent: body.htmlContent,
      heroImageUrl: body.heroImageUrl,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating email template:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create email template'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
