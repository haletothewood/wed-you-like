import type { EmailTemplateRepository } from '@/domain/repositories/EmailTemplateRepository'
import { EmailTemplate, type TemplateType } from '@/domain/entities/EmailTemplate'

interface CreateEmailTemplateInput {
  name: string
  templateType: TemplateType
  subject: string
  htmlContent: string
  heroImageUrl?: string
}

export class CreateEmailTemplate {
  constructor(private emailTemplateRepository: EmailTemplateRepository) {}

  async execute(input: CreateEmailTemplateInput): Promise<{ id: string }> {
    const template = EmailTemplate.create(input)
    await this.emailTemplateRepository.save(template)

    return { id: template.id }
  }
}
