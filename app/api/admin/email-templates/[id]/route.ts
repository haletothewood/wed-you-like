import { NextResponse } from 'next/server'
import { DrizzleEmailTemplateRepository } from '@/infrastructure/database/repositories/DrizzleEmailTemplateRepository'
import { UpdateEmailTemplate } from '@/application/use-cases/UpdateEmailTemplate'

const emailTemplateRepository = new DrizzleEmailTemplateRepository()

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateTemplate = new UpdateEmailTemplate(emailTemplateRepository)
    await updateTemplate.execute({
      id,
      subject: body.subject,
      htmlContent: body.htmlContent,
      heroImageUrl: body.heroImageUrl,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating email template:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to update email template'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await emailTemplateRepository.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    )
  }
}
