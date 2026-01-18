import type { EmailTemplateRepository } from '@/domain/repositories/EmailTemplateRepository'
import type { EmailTemplate } from '@/domain/entities/EmailTemplate'

export class GetAllEmailTemplates {
  constructor(private emailTemplateRepository: EmailTemplateRepository) {}

  async execute(): Promise<EmailTemplate[]> {
    return this.emailTemplateRepository.findAll()
  }
}
