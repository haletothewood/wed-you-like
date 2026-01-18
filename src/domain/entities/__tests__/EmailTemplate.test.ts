import { describe, it, expect } from 'vitest'
import { EmailTemplate } from '../EmailTemplate'

describe('EmailTemplate Entity', () => {
  describe('creating an email template', () => {
    it('should create a template with all required fields', () => {
      const template = EmailTemplate.create({
        name: 'Wedding Invitation',
        templateType: 'invite',
        subject: 'You are invited to our wedding!',
        htmlContent: '<h1>Welcome!</h1><p>{{guest_name}}</p>',
      })

      expect(template.id).toBeDefined()
      expect(template.name).toBe('Wedding Invitation')
      expect(template.templateType).toBe('invite')
      expect(template.subject).toBe('You are invited to our wedding!')
      expect(template.htmlContent).toBe(
        '<h1>Welcome!</h1><p>{{guest_name}}</p>'
      )
      expect(template.heroImageUrl).toBeUndefined()
      expect(template.isActive).toBe(true)
    })

    it('should create a template with optional hero image URL', () => {
      const template = EmailTemplate.create({
        name: 'Wedding Invitation',
        templateType: 'invite',
        subject: 'You are invited!',
        htmlContent: '<h1>Welcome!</h1>',
        heroImageUrl: 'https://example.com/image.jpg',
      })

      expect(template.heroImageUrl).toBe('https://example.com/image.jpg')
    })

    it('should create a thank_you template', () => {
      const template = EmailTemplate.create({
        name: 'Thank You',
        templateType: 'thank_you',
        subject: 'Thank you for RSVPing',
        htmlContent: '<h1>Thanks!</h1>',
      })

      expect(template.templateType).toBe('thank_you')
    })
  })

  describe('validation', () => {
    it('should require name', () => {
      expect(() => {
        EmailTemplate.create({
          name: '',
          templateType: 'invite',
          subject: 'Subject',
          htmlContent: '<h1>Content</h1>',
        })
      }).toThrow('Template name is required')
    })

    it('should require valid template type', () => {
      expect(() => {
        EmailTemplate.create({
          name: 'Test',
          templateType: 'invalid' as 'invite',
          subject: 'Subject',
          htmlContent: '<h1>Content</h1>',
        })
      }).toThrow('Template type must be either "invite" or "thank_you"')
    })

    it('should require subject', () => {
      expect(() => {
        EmailTemplate.create({
          name: 'Test',
          templateType: 'invite',
          subject: '',
          htmlContent: '<h1>Content</h1>',
        })
      }).toThrow('Subject is required')
    })

    it('should require HTML content', () => {
      expect(() => {
        EmailTemplate.create({
          name: 'Test',
          templateType: 'invite',
          subject: 'Subject',
          htmlContent: '',
        })
      }).toThrow('HTML content is required')
    })

    it('should validate hero image URL format if provided', () => {
      expect(() => {
        EmailTemplate.create({
          name: 'Test',
          templateType: 'invite',
          subject: 'Subject',
          htmlContent: '<h1>Content</h1>',
          heroImageUrl: 'not-a-valid-url',
        })
      }).toThrow('Invalid hero image URL format')
    })

    it('should accept valid hero image URLs', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
        heroImageUrl: 'https://example.com/image.png',
      })

      expect(template.heroImageUrl).toBe('https://example.com/image.png')
    })
  })

  describe('activation and deactivation', () => {
    it('should be active by default', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
      })

      expect(template.isActive).toBe(true)
    })

    it('should deactivate a template', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
      })

      template.deactivate()

      expect(template.isActive).toBe(false)
    })

    it('should activate a template', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
      })

      template.deactivate()
      template.activate()

      expect(template.isActive).toBe(true)
    })
  })

  describe('update content', () => {
    it('should update subject and HTML content', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Old Subject',
        htmlContent: '<h1>Old Content</h1>',
      })

      template.updateContent({
        subject: 'New Subject',
        htmlContent: '<h1>New Content</h1>',
      })

      expect(template.subject).toBe('New Subject')
      expect(template.htmlContent).toBe('<h1>New Content</h1>')
    })

    it('should update hero image URL', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
        heroImageUrl: 'https://example.com/old.jpg',
      })

      template.updateContent({
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
        heroImageUrl: 'https://example.com/new.jpg',
      })

      expect(template.heroImageUrl).toBe('https://example.com/new.jpg')
    })

    it('should validate subject on update', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
      })

      expect(() => {
        template.updateContent({
          subject: '',
          htmlContent: '<h1>Content</h1>',
        })
      }).toThrow('Subject is required')
    })

    it('should validate HTML content on update', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
      })

      expect(() => {
        template.updateContent({
          subject: 'Subject',
          htmlContent: '',
        })
      }).toThrow('HTML content is required')
    })

    it('should validate hero image URL on update', () => {
      const template = EmailTemplate.create({
        name: 'Test',
        templateType: 'invite',
        subject: 'Subject',
        htmlContent: '<h1>Content</h1>',
      })

      expect(() => {
        template.updateContent({
          subject: 'Subject',
          htmlContent: '<h1>Content</h1>',
          heroImageUrl: 'invalid-url',
        })
      }).toThrow('Invalid hero image URL format')
    })
  })
})
