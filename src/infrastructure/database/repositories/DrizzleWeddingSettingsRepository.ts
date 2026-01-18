import type { WeddingSettingsRepository } from '@/domain/repositories/WeddingSettingsRepository'
import { WeddingSettings } from '@/domain/entities/WeddingSettings'
import { db } from '../connection'
import { weddingSettings } from '../schema'

export class DrizzleWeddingSettingsRepository
  implements WeddingSettingsRepository
{
  async save(settings: WeddingSettings): Promise<void> {
    await db
      .insert(weddingSettings)
      .values({
        id: settings.id,
        partner1Name: settings.partner1Name,
        partner2Name: settings.partner2Name,
        weddingDate: settings.weddingDate,
        weddingTime: settings.weddingTime,
        venueName: settings.venueName,
        venueAddress: settings.venueAddress,
        dressCode: settings.dressCode,
        rsvpDeadline: settings.rsvpDeadline,
        registryUrl: settings.registryUrl,
        additionalInfo: settings.additionalInfo,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      })
      .onConflictDoUpdate({
        target: weddingSettings.id,
        set: {
          partner1Name: settings.partner1Name,
          partner2Name: settings.partner2Name,
          weddingDate: settings.weddingDate,
          weddingTime: settings.weddingTime,
          venueName: settings.venueName,
          venueAddress: settings.venueAddress,
          dressCode: settings.dressCode,
          rsvpDeadline: settings.rsvpDeadline,
          registryUrl: settings.registryUrl,
          additionalInfo: settings.additionalInfo,
          updatedAt: settings.updatedAt,
        },
      })
  }

  async get(): Promise<WeddingSettings | null> {
    const record = await db.query.weddingSettings.findFirst()

    if (!record) {
      return null
    }

    return this.toDomain(record)
  }

  private toDomain(record: {
    id: string
    partner1Name: string
    partner2Name: string
    weddingDate: string
    weddingTime: string
    venueName: string
    venueAddress: string
    dressCode: string | null
    rsvpDeadline: string | null
    registryUrl: string | null
    additionalInfo: string | null
    createdAt: Date
    updatedAt: Date
  }): WeddingSettings {
    const settings = Object.create(WeddingSettings.prototype)
    settings.props = {
      id: record.id,
      partner1Name: record.partner1Name,
      partner2Name: record.partner2Name,
      weddingDate: record.weddingDate,
      weddingTime: record.weddingTime,
      venueName: record.venueName,
      venueAddress: record.venueAddress,
      dressCode: record.dressCode || undefined,
      rsvpDeadline: record.rsvpDeadline || undefined,
      registryUrl: record.registryUrl || undefined,
      additionalInfo: record.additionalInfo || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return settings
  }
}
