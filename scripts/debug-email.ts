import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as readline from 'readline'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found in .env file')
  process.exit(1)
}

const resend = new Resend(apiKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function debugEmail() {
  console.log('🔍 Email Debugging Tool')
  console.log('======================\n')

  const email = await askQuestion('Enter the email address to test: ')

  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address')
    rl.close()
    return
  }

  console.log(`\n📧 Sending test email to: ${email}`)
  console.log('⏳ Please wait...\n')

  try {
    const result = await resend.emails.send({
      from: 'Wedding RSVP <onboarding@resend.dev>',
      to: email,
      subject: 'Test Email - Wedding RSVP System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #667eea;">Test Email Successful! 🎉</h1>
          <p>If you're seeing this email, your Resend integration is working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is a test email from your Wedding RSVP application.
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error('❌ Resend API returned an error:')
      console.error(JSON.stringify(result.error, null, 2))
      console.log('\n💡 Common issues:')
      console.log('   - Free tier only allows sending to verified domains')
      console.log('   - Check if your email is on a suppression list')
      console.log('   - Verify your Resend account is active')
    } else if (result.data?.id) {
      console.log('✅ Email sent successfully!')
      console.log(`📧 Email ID: ${result.data.id}`)
      console.log(`\n📍 Check Resend dashboard: https://resend.com/emails/${result.data.id}`)
      console.log('\n✉️  Check your inbox (and spam folder) for:')
      console.log(`   To: ${email}`)
      console.log(`   From: Wedding RSVP <onboarding@resend.dev>`)
      console.log(`   Subject: Test Email - Wedding RSVP System`)
      console.log('\n💡 If you don\'t see it:')
      console.log('   1. Check spam/junk folder')
      console.log('   2. Wait 1-2 minutes for delivery')
      console.log('   3. Check Resend dashboard for delivery status')
      console.log('   4. Verify email address is correct')
    } else {
      console.error('❌ Unexpected response from Resend:')
      console.error(JSON.stringify(result, null, 2))
    }
  } catch (error) {
    console.error('❌ Failed to send email:')
    console.error(error)
  }

  rl.close()
}

debugEmail()
