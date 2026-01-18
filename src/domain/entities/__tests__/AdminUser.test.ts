import { describe, it, expect } from 'vitest'
import { AdminUser } from '../AdminUser'

describe('AdminUser', () => {
  const validPasswordHash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH'

  describe('create', () => {
    it('should create an admin user with valid data', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      expect(adminUser.id).toBeDefined()
      expect(adminUser.username).toBe('johndoe')
      expect(adminUser.email).toBe('john@example.com')
      expect(adminUser.passwordHash).toBe(validPasswordHash)
      expect(adminUser.isActive).toBe(true)
      expect(adminUser.lastLoginAt).toBeNull()
      expect(adminUser.createdAt).toBeInstanceOf(Date)
      expect(adminUser.updatedAt).toBeInstanceOf(Date)
    })

    it('should normalize username to lowercase', () => {
      const adminUser = AdminUser.create({
        username: 'JohnDoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      expect(adminUser.username).toBe('johndoe')
    })

    it('should normalize email to lowercase', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'John@Example.Com',
        passwordHash: validPasswordHash,
      })

      expect(adminUser.email).toBe('john@example.com')
    })

    it('should throw error if username is empty', () => {
      expect(() =>
        AdminUser.create({
          username: '',
          email: 'john@example.com',
          passwordHash: validPasswordHash,
        })
      ).toThrow('Username is required')
    })

    it('should throw error if username is less than 3 characters', () => {
      expect(() =>
        AdminUser.create({
          username: 'ab',
          email: 'john@example.com',
          passwordHash: validPasswordHash,
        })
      ).toThrow('Username must be at least 3 characters long')
    })

    it('should throw error if username contains non-alphanumeric characters', () => {
      expect(() =>
        AdminUser.create({
          username: 'john@doe',
          email: 'john@example.com',
          passwordHash: validPasswordHash,
        })
      ).toThrow('Username must contain only alphanumeric characters and underscores')
    })

    it('should accept username with underscores', () => {
      const adminUser = AdminUser.create({
        username: 'john_doe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      expect(adminUser.username).toBe('john_doe')
    })

    it('should throw error if email is empty', () => {
      expect(() =>
        AdminUser.create({
          username: 'johndoe',
          email: '',
          passwordHash: validPasswordHash,
        })
      ).toThrow('Email is required')
    })

    it('should throw error if email format is invalid', () => {
      expect(() =>
        AdminUser.create({
          username: 'johndoe',
          email: 'invalid-email',
          passwordHash: validPasswordHash,
        })
      ).toThrow('Invalid email format')
    })

    it('should throw error if passwordHash is empty', () => {
      expect(() =>
        AdminUser.create({
          username: 'johndoe',
          email: 'john@example.com',
          passwordHash: '',
        })
      ).toThrow('Password hash is required')
    })
  })

  describe('markAsLoggedIn', () => {
    it('should update lastLoginAt and updatedAt', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      const beforeLogin = new Date()
      adminUser.markAsLoggedIn()

      expect(adminUser.lastLoginAt).toBeInstanceOf(Date)
      expect(adminUser.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime())
      expect(adminUser.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime())
    })
  })

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      adminUser.deactivate()

      expect(adminUser.isActive).toBe(false)
    })

    it('should update updatedAt', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      const beforeDeactivate = new Date()
      adminUser.deactivate()

      expect(adminUser.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDeactivate.getTime())
    })
  })

  describe('activate', () => {
    it('should set isActive to true', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      adminUser.deactivate()
      adminUser.activate()

      expect(adminUser.isActive).toBe(true)
    })

    it('should update updatedAt', () => {
      const adminUser = AdminUser.create({
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: validPasswordHash,
      })

      adminUser.deactivate()
      const beforeActivate = new Date()
      adminUser.activate()

      expect(adminUser.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeActivate.getTime())
    })
  })
})
