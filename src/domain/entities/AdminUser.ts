import { nanoid } from 'nanoid'

export interface AdminUserProps {
  id: string
  username: string
  email: string
  passwordHash: string
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class AdminUser {
  private constructor(private props: AdminUserProps) {}

  get id(): string {
    return this.props.id
  }

  get username(): string {
    return this.props.username
  }

  get email(): string {
    return this.props.email
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(params: {
    username: string
    email: string
    passwordHash: string
  }): AdminUser {
    AdminUser.validateUsername(params.username)
    AdminUser.validateEmail(params.email)
    AdminUser.validatePasswordHash(params.passwordHash)

    const now = new Date()

    return new AdminUser({
      id: nanoid(),
      username: params.username.toLowerCase(),
      email: params.email.toLowerCase(),
      passwordHash: params.passwordHash,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  private static validateUsername(username: string): void {
    if (!username || username.trim() === '') {
      throw new Error('Username is required')
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      throw new Error('Username must contain only alphanumeric characters and underscores')
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

  private static validatePasswordHash(passwordHash: string): void {
    if (!passwordHash || passwordHash.trim() === '') {
      throw new Error('Password hash is required')
    }
  }

  markAsLoggedIn(): void {
    const now = new Date()
    this.props.lastLoginAt = now
    this.props.updatedAt = now
  }

  deactivate(): void {
    this.props.isActive = false
    this.props.updatedAt = new Date()
  }

  activate(): void {
    this.props.isActive = true
    this.props.updatedAt = new Date()
  }
}
