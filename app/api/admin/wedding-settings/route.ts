import { NextResponse } from 'next/server'
import { DrizzleWeddingSettingsRepository } from '@/infrastructure/database/repositories/DrizzleWeddingSettingsRepository'
import { GetWeddingSettings } from '@/application/use-cases/GetWeddingSettings'
import { UpdateWeddingSettings } from '@/application/use-cases/UpdateWeddingSettings'

const weddingSettingsRepository = new DrizzleWeddingSettingsRepository()

export async function GET() {
  try {
    const getWeddingSettings = new GetWeddingSettings(weddingSettingsRepository)
    const settings = await getWeddingSettings.execute()

    if (!settings) {
      return NextResponse.json({ settings: null })
    }

    return NextResponse.json({
      settings: {
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
      },
    })
  } catch (error) {
    console.error('Error fetching wedding settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wedding settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const updateWeddingSettings = new UpdateWeddingSettings(
      weddingSettingsRepository
    )

    await updateWeddingSettings.execute({
      partner1Name: body.partner1Name,
      partner2Name: body.partner2Name,
      weddingDate: body.weddingDate,
      weddingTime: body.weddingTime,
      venueName: body.venueName,
      venueAddress: body.venueAddress,
      dressCode: body.dressCode,
      rsvpDeadline: body.rsvpDeadline,
      registryUrl: body.registryUrl,
      additionalInfo: body.additionalInfo,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating wedding settings:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to update wedding settings'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
