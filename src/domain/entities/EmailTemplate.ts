import { nanoid } from 'nanoid'

export type TemplateType = 'invite' | 'thank_you'

export interface EmailTemplateProps {
  id: string
  name: string
  templateType: TemplateType
  subject: string
  htmlContent: string
  heroImageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class EmailTemplate {
  private constructor(private props: EmailTemplateProps) {}

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get templateType(): TemplateType {
    return this.props.templateType
  }

  get subject(): string {
    return this.props.subject
  }

  get htmlContent(): string {
    return this.props.htmlContent
  }

  get heroImageUrl(): string | undefined {
    return this.props.heroImageUrl
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(params: {
    name: string
    templateType: TemplateType
    subject: string
    htmlContent: string
    heroImageUrl?: string
  }): EmailTemplate {
    EmailTemplate.validateRequired(params.name, 'Template name')
    EmailTemplate.validateTemplateType(params.templateType)
    EmailTemplate.validateRequired(params.subject, 'Subject')
    EmailTemplate.validateRequired(params.htmlContent, 'HTML content')

    if (params.heroImageUrl) {
      EmailTemplate.validateUrl(params.heroImageUrl)
    }

    const now = new Date()

    return new EmailTemplate({
      id: nanoid(),
      name: params.name,
      templateType: params.templateType,
      subject: params.subject,
      htmlContent: params.htmlContent,
      heroImageUrl: params.heroImageUrl,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  deactivate(): void {
    this.props.isActive = false
    this.props.updatedAt = new Date()
  }

  activate(): void {
    this.props.isActive = true
    this.props.updatedAt = new Date()
  }

  updateContent(params: {
    subject: string
    htmlContent: string
    heroImageUrl?: string
  }): void {
    EmailTemplate.validateRequired(params.subject, 'Subject')
    EmailTemplate.validateRequired(params.htmlContent, 'HTML content')

    if (params.heroImageUrl) {
      EmailTemplate.validateUrl(params.heroImageUrl)
    }

    this.props.subject = params.subject
    this.props.htmlContent = params.htmlContent
    this.props.heroImageUrl = params.heroImageUrl
    this.props.updatedAt = new Date()
  }

  private static validateRequired(value: string, fieldName: string): void {
    if (!value || value.trim() === '') {
      throw new Error(`${fieldName} is required`)
    }
  }

  private static validateTemplateType(type: string): void {
    if (type !== 'invite' && type !== 'thank_you') {
      throw new Error('Template type must be either "invite" or "thank_you"')
    }
  }

  private static validateUrl(url: string): void {
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid hero image URL format')
    }
  }
}
