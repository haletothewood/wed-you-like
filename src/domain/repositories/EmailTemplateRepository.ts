import { EmailTemplate, TemplateType } from '../entities/EmailTemplate'

export interface EmailTemplateRepository {
  save(template: EmailTemplate): Promise<void>
  findById(id: string): Promise<EmailTemplate | null>
  findAll(): Promise<EmailTemplate[]>
  findByType(type: TemplateType): Promise<EmailTemplate[]>
  findActiveByType(type: TemplateType): Promise<EmailTemplate | null>
  delete(id: string): Promise<void>
}
