import type { WeddingSettingsRepository } from '@/domain/repositories/WeddingSettingsRepository'
import type { WeddingSettings } from '@/domain/entities/WeddingSettings'

export class GetWeddingSettings {
  constructor(
    private weddingSettingsRepository: WeddingSettingsRepository
  ) {}

  async execute(): Promise<WeddingSettings | null> {
    return this.weddingSettingsRepository.get()
  }
}
