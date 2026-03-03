import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { EmailTemplate } from '@/domain/entities/EmailTemplate'
import { DrizzleEmailTemplateRepository } from './repositories/DrizzleEmailTemplateRepository'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const emailTemplateRepository = new DrizzleEmailTemplateRepository()

const defaultTemplateHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Avenir Next', Figtree, 'Trebuchet MS', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ecebe1; color: #1d1d1b;">
  <div style="background: #f5f4ee; border: 1px solid #d2d1c3; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(29,29,27,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #5b623f; margin: 0;">You're Invited!</h1>
      <p style="color: #4f4f46; font-size: 1.2em; margin: 10px 0;">{{partner1_name}} & {{partner2_name}}</p>
    </div>

    <p>Dear {{guest_name}},</p>

    <p>We're excited to invite you to celebrate our wedding!</p>

    <div style="background: #e7e6dc; border: 1px solid #d2d1c3; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="margin: 5px 0;"><strong>Date:</strong> {{wedding_date}}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> {{wedding_time}}</p>
      <p style="margin: 5px 0;"><strong>Venue:</strong> {{venue_name}}</p>
      <p style="margin: 5px 0; white-space: pre-line;">{{venue_address}}</p>
      <p style="margin: 5px 0;"><strong>Dress Code:</strong> {{dress_code}}</p>
    </div>

    <p>Please let us know if you can join us by clicking the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{rsvp_url}}" style="background: #5b623f; color: #ecebe1; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        RSVP Now
      </a>
    </div>

    <p style="text-align: center; color: #1d1d1b;"><strong>Please RSVP by {{rsvp_deadline}}</strong></p>

    <p>We can't wait to celebrate with you!</p>

    <p style="margin-top: 40px;">With love,<br>{{partner1_name}} & {{partner2_name}}</p>

    <hr style="border: none; border-top: 1px solid #d2d1c3; margin: 30px 0;">

    <p style="color: #5f5f56; font-size: 0.85em; text-align: center;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="{{rsvp_url}}" style="color: #5b623f;">{{rsvp_url}}</a>
    </p>
  </div>
</body>
</html>`

async function seedEmailTemplate() {
  try {
    const existingTemplate =
      await emailTemplateRepository.findActiveByType('invite')

    if (existingTemplate) {
      console.log('Active invite email template already exists. Skipping seed.')
      return
    }

    const template = EmailTemplate.create({
      name: 'Default Wedding Invitation',
      templateType: 'invite',
      subject: "You're Invited: {{partner1_name}} & {{partner2_name}}'s Wedding 💍",
      htmlContent: defaultTemplateHtml,
    })

    await emailTemplateRepository.save(template)

    console.log('✅ Default email template created successfully!')
    console.log(`   Template ID: ${template.id}`)
    console.log(`   Template Name: ${template.name}`)
    console.log(`   Type: ${template.templateType}`)
    console.log(`   Status: Active`)
  } catch (error) {
    console.error('Failed to create email template:', error)
    process.exit(1)
  }
}

seedEmailTemplate()
  .then(() => {
    console.log('Seed completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
