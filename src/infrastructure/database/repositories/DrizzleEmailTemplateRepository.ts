import { eq, desc, and } from 'drizzle-orm'
import type { EmailTemplateRepository } from '@/domain/repositories/EmailTemplateRepository'
import { EmailTemplate, type TemplateType } from '@/domain/entities/EmailTemplate'
import { db } from '../connection'
import { emailTemplates } from '../schema'

export class DrizzleEmailTemplateRepository implements EmailTemplateRepository {
  async save(template: EmailTemplate): Promise<void> {
    await db
      .insert(emailTemplates)
      .values({
        id: template.id,
        name: template.name,
        templateType: template.templateType,
        subject: template.subject,
        htmlContent: template.htmlContent,
        heroImageUrl: template.heroImageUrl,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })
      .onConflictDoUpdate({
        target: emailTemplates.id,
        set: {
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          heroImageUrl: template.heroImageUrl,
          isActive: template.isActive,
          updatedAt: template.updatedAt,
        },
      })
  }

  async findById(id: string): Promise<EmailTemplate | null> {
    const record = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.id, id),
    })

    if (!record) {
      return null
    }

    return this.toDomain(record)
  }

  async findAll(): Promise<EmailTemplate[]> {
    const records = await db.query.emailTemplates.findMany({
      orderBy: desc(emailTemplates.updatedAt),
    })

    return records.map((record) => this.toDomain(record))
  }

  async findByType(type: TemplateType): Promise<EmailTemplate[]> {
    const records = await db.query.emailTemplates.findMany({
      where: eq(emailTemplates.templateType, type),
      orderBy: desc(emailTemplates.updatedAt),
    })

    return records.map((record) => this.toDomain(record))
  }

  async findActiveByType(type: TemplateType): Promise<EmailTemplate | null> {
    const record = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.templateType, type),
        eq(emailTemplates.isActive, true)
      ),
      orderBy: desc(emailTemplates.updatedAt),
    })

    if (!record) {
      return null
    }

    return this.toDomain(record)
  }

  async delete(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id))
  }

  private toDomain(record: {
    id: string
    name: string
    templateType: 'invite' | 'thank_you'
    subject: string
    htmlContent: string
    heroImageUrl: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }): EmailTemplate {
    const template = Object.create(EmailTemplate.prototype)
    template.props = {
      id: record.id,
      name: record.name,
      templateType: record.templateType,
      subject: record.subject,
      htmlContent: record.htmlContent,
      heroImageUrl: record.heroImageUrl || undefined,
      isActive: Boolean(record.isActive),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return template
  }
}
