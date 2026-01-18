import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env file
dotenv.config({ path: resolve(process.cwd(), '.env') })

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found in .env file')
  process.exit(1)
}

console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...')

const resend = new Resend(apiKey)

async function testEmail() {
  try {
    console.log('\n📧 Attempting to send test email...')

    const result = await resend.emails.send({
      from: 'Wedding RSVP <onboarding@resend.dev>',
      to: 'delivered@resend.dev', // Resend's test delivery address
      subject: 'Test Email from Wedding RSVP App',
      html: '<h1>Test Email</h1><p>This is a test email to verify Resend integration.</p>',
    })

    console.log('\n✅ SUCCESS! Email sent to Resend.')
    console.log('📊 Response:', JSON.stringify(result, null, 2))

    if (result.data?.id) {
      console.log(`\n🎉 Email ID: ${result.data.id}`)
      console.log('\n📍 Check your Resend dashboard: https://resend.com/emails')
    }

    if (result.error) {
      console.error('\n❌ Error from Resend:', result.error)
    }

  } catch (error) {
    console.error('\n❌ Failed to send email:')
    console.error(error)
  }
}

testEmail()
