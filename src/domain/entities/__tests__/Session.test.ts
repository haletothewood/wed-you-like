import { describe, it, expect } from 'vitest'
import { Session } from '../Session'

describe('Session', () => {
  const adminUserId = 'admin-user-123'

  describe('create', () => {
    it('should create a session with default 24 hour expiry', () => {
      const session = Session.create({ adminUserId })

      expect(session.id).toBeDefined()
      expect(session.adminUserId).toBe(adminUserId)
      expect(session.token).toBeDefined()
      expect(session.token.length).toBe(32)
      expect(session.expiresAt).toBeInstanceOf(Date)
      expect(session.createdAt).toBeInstanceOf(Date)

      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const timeDiff = Math.abs(session.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(1000)
    })

    it('should create a session with custom expiry in hours', () => {
      const session = Session.create({ adminUserId, expiryHours: 48 })

      const expectedExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const timeDiff = Math.abs(session.expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(1000)
    })

    it('should generate a unique 32 character token', () => {
      const session1 = Session.create({ adminUserId })
      const session2 = Session.create({ adminUserId })

      expect(session1.token).not.toBe(session2.token)
      expect(session1.token.length).toBe(32)
      expect(session2.token.length).toBe(32)
    })

    it('should throw error if adminUserId is empty', () => {
      expect(() => Session.create({ adminUserId: '' })).toThrow('Admin user ID is required')
    })

    it('should throw error if expiryHours is less than 1', () => {
      expect(() => Session.create({ adminUserId, expiryHours: 0 })).toThrow(
        'Expiry hours must be at least 1'
      )
    })

    it('should throw error if expiryHours is greater than 168 (7 days)', () => {
      expect(() => Session.create({ adminUserId, expiryHours: 169 })).toThrow(
        'Expiry hours cannot exceed 168 (7 days)'
      )
    })
  })

  describe('isExpired', () => {
    it('should return false for a newly created session', () => {
      const session = Session.create({ adminUserId })

      expect(session.isExpired()).toBe(false)
    })

    it('should return true for an expired session', () => {
      const pastExpiry = new Date(Date.now() - 1000)
      const session = Session.reconstitute({
        id: 'session-123',
        adminUserId,
        token: 'test-token',
        expiresAt: pastExpiry,
        createdAt: new Date(),
      })

      expect(session.isExpired()).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true for a non-expired session', () => {
      const session = Session.create({ adminUserId })

      expect(session.isValid()).toBe(true)
    })

    it('should return false for an expired session', () => {
      const pastExpiry = new Date(Date.now() - 1000)
      const session = Session.reconstitute({
        id: 'session-123',
        adminUserId,
        token: 'test-token',
        expiresAt: pastExpiry,
        createdAt: new Date(),
      })

      expect(session.isValid()).toBe(false)
    })
  })
})
