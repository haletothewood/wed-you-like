import { nanoid } from 'nanoid'

export interface WeddingSettingsProps {
  id: string
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
  createdAt: Date
  updatedAt: Date
}

export class WeddingSettings {
  private constructor(private props: WeddingSettingsProps) {}

  get id(): string {
    return this.props.id
  }

  get partner1Name(): string {
    return this.props.partner1Name
  }

  get partner2Name(): string {
    return this.props.partner2Name
  }

  get weddingDate(): string {
    return this.props.weddingDate
  }

  get weddingTime(): string {
    return this.props.weddingTime
  }

  get venueName(): string {
    return this.props.venueName
  }

  get venueAddress(): string {
    return this.props.venueAddress
  }

  get dressCode(): string | undefined {
    return this.props.dressCode
  }

  get rsvpDeadline(): string | undefined {
    return this.props.rsvpDeadline
  }

  get registryUrl(): string | undefined {
    return this.props.registryUrl
  }

  get additionalInfo(): string | undefined {
    return this.props.additionalInfo
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(params: {
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
  }): WeddingSettings {
    WeddingSettings.validateRequired(params.partner1Name, 'Partner 1 name')
    WeddingSettings.validateRequired(params.partner2Name, 'Partner 2 name')
    WeddingSettings.validateRequired(params.weddingDate, 'Wedding date')
    WeddingSettings.validateRequired(params.weddingTime, 'Wedding time')
    WeddingSettings.validateRequired(params.venueName, 'Venue name')
    WeddingSettings.validateRequired(params.venueAddress, 'Venue address')

    const now = new Date()

    return new WeddingSettings({
      id: nanoid(),
      partner1Name: params.partner1Name,
      partner2Name: params.partner2Name,
      weddingDate: params.weddingDate,
      weddingTime: params.weddingTime,
      venueName: params.venueName,
      venueAddress: params.venueAddress,
      dressCode: params.dressCode,
      rsvpDeadline: params.rsvpDeadline,
      registryUrl: params.registryUrl,
      additionalInfo: params.additionalInfo,
      createdAt: now,
      updatedAt: now,
    })
  }

  update(params: Partial<{
    partner1Name: string
    partner2Name: string
    weddingDate: string
    weddingTime: string
    venueName: string
    venueAddress: string
    dressCode: string
    rsvpDeadline: string
    registryUrl: string
    additionalInfo: string
  }>): void {
    if (params.partner1Name !== undefined) {
      WeddingSettings.validateRequired(params.partner1Name, 'Partner 1 name')
      this.props.partner1Name = params.partner1Name
    }

    if (params.partner2Name !== undefined) {
      WeddingSettings.validateRequired(params.partner2Name, 'Partner 2 name')
      this.props.partner2Name = params.partner2Name
    }

    if (params.weddingDate !== undefined) {
      WeddingSettings.validateRequired(params.weddingDate, 'Wedding date')
      this.props.weddingDate = params.weddingDate
    }

    if (params.weddingTime !== undefined) {
      WeddingSettings.validateRequired(params.weddingTime, 'Wedding time')
      this.props.weddingTime = params.weddingTime
    }

    if (params.venueName !== undefined) {
      WeddingSettings.validateRequired(params.venueName, 'Venue name')
      this.props.venueName = params.venueName
    }

    if (params.venueAddress !== undefined) {
      WeddingSettings.validateRequired(params.venueAddress, 'Venue address')
      this.props.venueAddress = params.venueAddress
    }

    if (params.dressCode !== undefined) {
      this.props.dressCode = params.dressCode
    }

    if (params.rsvpDeadline !== undefined) {
      this.props.rsvpDeadline = params.rsvpDeadline
    }

    if (params.registryUrl !== undefined) {
      this.props.registryUrl = params.registryUrl
    }

    if (params.additionalInfo !== undefined) {
      this.props.additionalInfo = params.additionalInfo
    }

    this.props.updatedAt = new Date()
  }

  private static validateRequired(value: string, fieldName: string): void {
    if (!value || value.trim() === '') {
      throw new Error(`${fieldName} is required`)
    }
  }
}
