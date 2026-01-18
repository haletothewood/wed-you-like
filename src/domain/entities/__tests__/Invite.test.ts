import { describe, it, expect } from 'vitest'
import { Invite } from '../Invite'

describe('Invite Entity', () => {
  describe('creating an individual invite', () => {
    it('should create an invite for a single guest', () => {
      const invite = Invite.createIndividual({
        guestName: 'John Smith',
        email: 'john@example.com',
      })

      expect(invite.id).toBeDefined()
      expect(invite.token).toBeDefined()
      expect(invite.token.length).toBeGreaterThan(10)
      expect(invite.groupName).toBeNull()
      expect(invite.adultsCount).toBe(1)
      expect(invite.childrenCount).toBe(0)
      expect(invite.plusOneAllowed).toBe(false)
      expect(invite.guests).toHaveLength(1)
      expect(invite.guests[0].name).toBe('John Smith')
      expect(invite.guests[0].email).toBe('john@example.com')
    })

    it('should allow creating an invite with plus one', () => {
      const invite = Invite.createIndividual({
        guestName: 'Jane Doe',
        email: 'jane@example.com',
        plusOneAllowed: true,
      })

      expect(invite.plusOneAllowed).toBe(true)
      expect(invite.adultsCount).toBe(1)
    })
  })

  describe('creating a group invite', () => {
    it('should create a group invite with multiple adults and children', () => {
      const invite = Invite.createGroup({
        groupName: 'The Smiths',
        adultsCount: 2,
        childrenCount: 1,
        guests: [
          { name: 'John Smith', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
          { name: 'Billy Smith', email: '' },
        ],
      })

      expect(invite.groupName).toBe('The Smiths')
      expect(invite.adultsCount).toBe(2)
      expect(invite.childrenCount).toBe(1)
      expect(invite.guests).toHaveLength(3)
      expect(invite.token).toBeDefined()
    })

    it('should throw error if guests count does not match adultsCount + childrenCount', () => {
      expect(() => {
        Invite.createGroup({
          groupName: 'The Smiths',
          adultsCount: 2,
          childrenCount: 1,
          guests: [{ name: 'John Smith', email: 'john@example.com' }],
        })
      }).toThrow('Guest count must match adultsCount + childrenCount')
    })

    it('should require at least one guest with an email', () => {
      expect(() => {
        Invite.createGroup({
          groupName: 'The Smiths',
          adultsCount: 2,
          childrenCount: 0,
          guests: [
            { name: 'John Smith', email: '' },
            { name: 'Jane Smith', email: '' },
          ],
        })
      }).toThrow('At least one guest must have an email address')
    })
  })

  describe('token generation', () => {
    it('should generate unique tokens for different invites', () => {
      const invite1 = Invite.createIndividual({
        guestName: 'John Smith',
        email: 'john@example.com',
      })

      const invite2 = Invite.createIndividual({
        guestName: 'Jane Doe',
        email: 'jane@example.com',
      })

      expect(invite1.token).not.toBe(invite2.token)
    })

    it('should generate URL-safe tokens', () => {
      const invite = Invite.createIndividual({
        guestName: 'John Smith',
        email: 'john@example.com',
      })

      // URL-safe characters only (alphanumeric, -, _)
      expect(invite.token).toMatch(/^[a-zA-Z0-9_-]+$/)
    })
  })

  describe('validation', () => {
    it('should require guest name', () => {
      expect(() => {
        Invite.createIndividual({
          guestName: '',
          email: 'john@example.com',
        })
      }).toThrow('Guest name is required')
    })

    it('should require valid email format', () => {
      expect(() => {
        Invite.createIndividual({
          guestName: 'John Smith',
          email: 'invalid-email',
        })
      }).toThrow('Invalid email format')
    })

    it('should require group name for group invites', () => {
      expect(() => {
        Invite.createGroup({
          groupName: '',
          adultsCount: 2,
          childrenCount: 0,
          guests: [
            { name: 'John', email: 'john@example.com' },
            { name: 'Jane', email: 'jane@example.com' },
          ],
        })
      }).toThrow('Group name is required')
    })
  })
})
