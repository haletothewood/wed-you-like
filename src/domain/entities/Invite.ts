import { nanoid } from 'nanoid'

export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  isPlusOne: boolean
  isChild: boolean
  parentGuestId?: string
  isInviteLead: boolean
}

export type InviteSentVia = 'email' | 'whatsapp'

export interface InviteProps {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Guest[]
  sentAt: Date | null
  sentVia: InviteSentVia | null
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

  get sentVia(): InviteSentVia | null {
    return this.props.sentVia
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static createIndividual(params: {
    guestName: string
    email?: string
    phone?: string
    plusOneAllowed?: boolean
  }): Invite {
    Invite.validateGuestName(params.guestName)
    Invite.validateContactMethods(params.email, params.phone)

    const email = params.email?.trim() || ''
    const phone = params.phone?.trim() || ''

    if (email) {
      Invite.validateEmail(email)
    }

    if (phone) {
      Invite.validatePhone(phone)
    }

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
          email,
          phone,
          isPlusOne: false,
          isChild: false,
          parentGuestId: undefined,
          isInviteLead: true,
        },
      ],
      sentAt: null,
      sentVia: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static createGroup(params: {
    groupName: string
    guests: Array<{
      id: string
      name: string
      email: string
      phone?: string
      isChild: boolean
      parentGuestId?: string
      isInviteLead?: boolean
    }>
  }): Invite {
    if (!params.groupName || params.groupName.trim() === '') {
      throw new Error('Group name is required')
    }

    if (params.guests.length < 2) {
      throw new Error('Group invite requires at least two guests')
    }

    const hasContactGuest = params.guests.some(
      (g) =>
        (g.email && g.email.trim() !== '') ||
        (g.phone && g.phone.trim() !== '')
    )
    if (!hasContactGuest) {
      throw new Error('At least one guest must have an email address or phone number')
    }

    const guestIds = new Set(params.guests.map((g) => g.id))
    if (guestIds.size !== params.guests.length) {
      throw new Error('Each guest must have a unique ID')
    }

    const adults = params.guests.filter((g) => !g.isChild)
    const children = params.guests.filter((g) => g.isChild)

    if (adults.length === 0) {
      throw new Error('Group invite must include at least one adult guest')
    }

    for (const guest of params.guests) {
      Invite.validateGuestName(guest.name)
      if (guest.email && guest.email.trim() !== '') {
        Invite.validateEmail(guest.email)
      }
      if (guest.phone && guest.phone.trim() !== '') {
        Invite.validatePhone(guest.phone)
      }

      if (!guest.isChild && guest.parentGuestId) {
        throw new Error('Adult guests cannot have a parent guest')
      }

      if (guest.isChild && !guest.parentGuestId) {
        throw new Error('Child guests must have a parent guest')
      }
    }

    const adultsById = new Map(adults.map((g) => [g.id, g]))

    for (const child of children) {
      if (!child.parentGuestId || !guestIds.has(child.parentGuestId)) {
        throw new Error('Child guest parent must exist in the same invite')
      }

      const parent = adultsById.get(child.parentGuestId)
      if (!parent) {
        throw new Error('Child guest parent must be an adult guest')
      }

      if (parent.isInviteLead) {
        throw new Error('Children cannot be assigned to the invite lead')
      }
    }

    const leadCount = adults.filter((g) => g.isInviteLead).length
    if (leadCount > 1) {
      throw new Error('Only one invite lead is allowed per group invite')
    }
    const firstAdultId = adults[0]?.id

    const adultsCount = adults.length
    const childrenCount = children.length

    const now = new Date()

    return new Invite({
      id: nanoid(),
      token: nanoid(21),
      groupName: params.groupName,
      adultsCount,
      childrenCount,
      plusOneAllowed: false,
      guests: params.guests.map((g) => ({
        id: g.id,
        name: g.name,
        email: g.email,
        phone: g.phone?.trim() || '',
        isPlusOne: false,
        isChild: g.isChild,
        parentGuestId: g.parentGuestId,
        isInviteLead: leadCount === 0 ? g.id === firstAdultId : Boolean(g.isInviteLead),
      })),
      sentAt: null,
      sentVia: null,
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  private static validatePhone(phone: string): void {
    const phoneRegex = /^\+?[0-9\s().-]{8,20}$/
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone format')
    }
  }

  private static validateContactMethods(email?: string, phone?: string): void {
    if ((!email || email.trim() === '') && (!phone || phone.trim() === '')) {
      throw new Error('At least one contact method is required')
    }
  }

  markAsSent(via: InviteSentVia): void {
    this.props.sentAt = new Date()
    this.props.sentVia = via
    this.props.updatedAt = new Date()
  }
}
