import { nanoid } from 'nanoid'

export interface RSVPProps {
  id: string
  inviteId: string
  isAttending: boolean
  adultsAttending: number
  childrenAttending: number
  dietaryRequirements: string | null
  respondedAt: Date
  createdAt: Date
  updatedAt: Date
}

export class RSVP {
  private constructor(private props: RSVPProps) {}

  get id(): string {
    return this.props.id
  }

  get inviteId(): string {
    return this.props.inviteId
  }

  get isAttending(): boolean {
    return this.props.isAttending
  }

  get adultsAttending(): number {
    return this.props.adultsAttending
  }

  get childrenAttending(): number {
    return this.props.childrenAttending
  }

  get dietaryRequirements(): string | null {
    return this.props.dietaryRequirements
  }

  get respondedAt(): Date {
    return this.props.respondedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(params: {
    inviteId: string
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
    dietaryRequirements?: string
  }): RSVP {
    RSVP.validate(params)

    const now = new Date()

    return new RSVP({
      id: nanoid(),
      inviteId: params.inviteId,
      isAttending: params.isAttending,
      adultsAttending: params.adultsAttending,
      childrenAttending: params.childrenAttending,
      dietaryRequirements: params.dietaryRequirements || null,
      respondedAt: now,
      createdAt: now,
      updatedAt: now,
    })
  }

  updateAttendance(params: {
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
    dietaryRequirements?: string
  }): void {
    RSVP.validate({
      inviteId: this.props.inviteId,
      ...params,
    })

    this.props.isAttending = params.isAttending
    this.props.adultsAttending = params.adultsAttending
    this.props.childrenAttending = params.childrenAttending
    this.props.dietaryRequirements = params.dietaryRequirements || null
    this.props.updatedAt = new Date()
  }

  private static validate(params: {
    inviteId: string
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
  }): void {
    if (!params.inviteId || params.inviteId.trim() === '') {
      throw new Error('Invite ID is required')
    }

    if (params.adultsAttending < 0 || params.childrenAttending < 0) {
      throw new Error('Attendee counts cannot be negative')
    }

    if (
      params.isAttending &&
      params.adultsAttending === 0 &&
      params.childrenAttending === 0
    ) {
      throw new Error('At least one person must be attending')
    }
  }
}
