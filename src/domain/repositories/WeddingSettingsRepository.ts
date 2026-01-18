import { WeddingSettings } from '../entities/WeddingSettings'

export interface WeddingSettingsRepository {
  save(settings: WeddingSettings): Promise<void>
  get(): Promise<WeddingSettings | null>
}
