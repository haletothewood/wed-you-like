import { nanoid } from 'nanoid'
import crypto from 'crypto'

export interface SessionProps {
  id: string
  adminUserId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export class Session {
  private constructor(private props: SessionProps) {}

  get id(): string {
    return this.props.id
  }

  get adminUserId(): string {
    return this.props.adminUserId
  }

  get token(): string {
    return this.props.token
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  static create(params: { adminUserId: string; expiryHours?: number }): Session {
    Session.validateAdminUserId(params.adminUserId)

    const expiryHours = params.expiryHours ?? 24

    if (expiryHours < 1) {
      throw new Error('Expiry hours must be at least 1')
    }

    if (expiryHours > 168) {
      throw new Error('Expiry hours cannot exceed 168 (7 days)')
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000)
    const token = Session.generateSecureToken()

    return new Session({
      id: nanoid(),
      adminUserId: params.adminUserId,
      token,
      expiresAt,
      createdAt: now,
    })
  }

  static reconstitute(props: SessionProps): Session {
    return new Session(props)
  }

  private static validateAdminUserId(adminUserId: string): void {
    if (!adminUserId || adminUserId.trim() === '') {
      throw new Error('Admin user ID is required')
    }
  }

  private static generateSecureToken(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }

  isValid(): boolean {
    return !this.isExpired()
  }
}
