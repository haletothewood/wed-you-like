import type { WeddingSettingsRepository } from '@/domain/repositories/WeddingSettingsRepository'
import { WeddingSettings } from '@/domain/entities/WeddingSettings'

interface UpdateWeddingSettingsInput {
  partner1Name: string
  partner2Name: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueAddress: string
  dressCode?: string
  rsvpDeadline?: string
  registryUrl?: string
  additionalInfo?: string
}

export class UpdateWeddingSettings {
  constructor(
    private weddingSettingsRepository: WeddingSettingsRepository
  ) {}

  async execute(input: UpdateWeddingSettingsInput): Promise<void> {
    const existingSettings = await this.weddingSettingsRepository.get()

    if (existingSettings) {
      existingSettings.update(input)
      await this.weddingSettingsRepository.save(existingSettings)
    } else {
      const newSettings = WeddingSettings.create(input)
      await this.weddingSettingsRepository.save(newSettings)
    }
  }
}
