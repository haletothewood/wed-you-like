import { nanoid } from 'nanoid'

export interface Guest {
  id: string
  name: string
  email: string
}

export interface InviteProps {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Guest[]
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class Invite {
  private constructor(private props: InviteProps) {}

  get id(): string {
    return this.props.id
  }

  get token(): string {
    return this.props.token
  }

  get groupName(): string | null {
    return this.props.groupName
  }

  get adultsCount(): number {
    return this.props.adultsCount
  }

  get childrenCount(): number {
    return this.props.childrenCount
  }

  get plusOneAllowed(): boolean {
    return this.props.plusOneAllowed
  }

  get guests(): Guest[] {
    return this.props.guests
  }

  get sentAt(): Date | null {
    return this.props.sentAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static createIndividual(params: {
    guestName: string
    email: string
    plusOneAllowed?: boolean
  }): Invite {
    Invite.validateGuestName(params.guestName)
    Invite.validateEmail(params.email)

    const now = new Date()
    const guestId = nanoid()

    return new Invite({
      id: nanoid(),
      token: nanoid(21),
      groupName: null,
      adultsCount: 1,
      childrenCount: 0,
      plusOneAllowed: params.plusOneAllowed || false,
      guests: [
        {
          id: guestId,
          name: params.guestName,
          email: params.email,
        },
      ],
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static createGroup(params: {
    groupName: string
    adultsCount: number
    childrenCount: number
    guests: Array<{ name: string; email: string }>
  }): Invite {
    if (!params.groupName || params.groupName.trim() === '') {
      throw new Error('Group name is required')
    }

    const totalCount = params.adultsCount + params.childrenCount
    if (params.guests.length !== totalCount) {
      throw new Error('Guest count must match adultsCount + childrenCount')
    }

    const hasEmailGuest = params.guests.some(
      (g) => g.email && g.email.trim() !== ''
    )
    if (!hasEmailGuest) {
      throw new Error('At least one guest must have an email address')
    }

    params.guests.forEach((guest) => {
      Invite.validateGuestName(guest.name)
      if (guest.email && guest.email.trim() !== '') {
        Invite.validateEmail(guest.email)
      }
    })

    const now = new Date()

    return new Invite({
      id: nanoid(),
      token: nanoid(21),
      groupName: params.groupName,
      adultsCount: params.adultsCount,
      childrenCount: params.childrenCount,
      plusOneAllowed: false,
      guests: params.guests.map((g) => ({
        id: nanoid(),
        name: g.name,
        email: g.email,
      })),
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  private static validateGuestName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Guest name is required')
    }
  }

  private static validateEmail(email: string): void {
    if (!email || email.trim() === '') {
      throw new Error('Email is required')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  markAsSent(): void {
    this.props.sentAt = new Date()
    this.props.updatedAt = new Date()
  }
}
