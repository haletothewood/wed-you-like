import type { EmailTemplateRepository } from '@/domain/repositories/EmailTemplateRepository'

interface UpdateEmailTemplateInput {
  id: string
  subject: string
  htmlContent: string
  heroImageUrl?: string
}

export class UpdateEmailTemplate {
  constructor(private emailTemplateRepository: EmailTemplateRepository) {}

  async execute(input: UpdateEmailTemplateInput): Promise<void> {
    const template = await this.emailTemplateRepository.findById(input.id)

    if (!template) {
      throw new Error('Email template not found')
    }

    template.updateContent({
      subject: input.subject,
      htmlContent: input.htmlContent,
      heroImageUrl: input.heroImageUrl,
    })

    await this.emailTemplateRepository.save(template)
  }
}
