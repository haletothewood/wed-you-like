import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { WeddingSettings } from '@/domain/entities/WeddingSettings'
import { DrizzleWeddingSettingsRepository } from './repositories/DrizzleWeddingSettingsRepository'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()

async function seedWeddingSettings() {
  try {
    const existingSettings = await weddingSettingsRepository.get()
    if (existingSettings) {
      console.log('Wedding settings already exist. Skipping seed.')
      return
    }

    const settings = WeddingSettings.create({
      partner1Name: '[Partner 1 Name]',
      partner2Name: '[Partner 2 Name]',
      weddingDate: 'Saturday, [Date]',
      weddingTime: '[Time] PM',
      venueName: '[Venue Name]',
      venueAddress: '[Venue Address]',
      dressCode: '[Dress Code]',
      rsvpDeadline: '[RSVP Deadline]',
    })

    await weddingSettingsRepository.save(settings)

    console.log('✅ Default wedding settings created successfully!')
    console.log('   Please update the settings at /admin/wedding-settings')
  } catch (error) {
    console.error('Failed to create wedding settings:', error)
    process.exit(1)
  }
}

seedWeddingSettings()
  .then(() => {
    console.log('Seed completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
