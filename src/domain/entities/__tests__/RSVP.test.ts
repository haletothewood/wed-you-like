import { describe, it, expect } from 'vitest'
import { RSVP } from '../RSVP'

describe('RSVP Entity', () => {
  describe('creating an RSVP for attending', () => {
    it('should create an RSVP with attendance confirmation', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: true,
        adultsAttending: 2,
        childrenAttending: 1,
      })

      expect(rsvp.id).toBeDefined()
      expect(rsvp.inviteId).toBe('invite-123')
      expect(rsvp.isAttending).toBe(true)
      expect(rsvp.adultsAttending).toBe(2)
      expect(rsvp.childrenAttending).toBe(1)
      expect(rsvp.respondedAt).toBeInstanceOf(Date)
    })

    it('should allow dietary requirements', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
        dietaryRequirements: 'Vegetarian, no nuts',
      })

      expect(rsvp.dietaryRequirements).toBe('Vegetarian, no nuts')
    })
  })

  describe('creating an RSVP for not attending', () => {
    it('should create an RSVP declining the invite', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: false,
        adultsAttending: 0,
        childrenAttending: 0,
      })

      expect(rsvp.isAttending).toBe(false)
      expect(rsvp.adultsAttending).toBe(0)
      expect(rsvp.childrenAttending).toBe(0)
    })

    it('should not require dietary requirements when not attending', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: false,
        adultsAttending: 0,
        childrenAttending: 0,
      })

      expect(rsvp.dietaryRequirements).toBeNull()
    })
  })

  describe('validation', () => {
    it('should require inviteId', () => {
      expect(() => {
        RSVP.create({
          inviteId: '',
          isAttending: true,
          adultsAttending: 1,
          childrenAttending: 0,
        })
      }).toThrow('Invite ID is required')
    })

    it('should require at least one attendee if attending', () => {
      expect(() => {
        RSVP.create({
          inviteId: 'invite-123',
          isAttending: true,
          adultsAttending: 0,
          childrenAttending: 0,
        })
      }).toThrow('At least one person must be attending')
    })

    it('should not allow negative attendee counts', () => {
      expect(() => {
        RSVP.create({
          inviteId: 'invite-123',
          isAttending: true,
          adultsAttending: -1,
          childrenAttending: 0,
        })
      }).toThrow('Attendee counts cannot be negative')
    })

    it('should allow zero attendees when not attending', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: false,
        adultsAttending: 0,
        childrenAttending: 0,
      })

      expect(rsvp.isAttending).toBe(false)
    })
  })

  describe('updating RSVP', () => {
    it('should allow updating attendance status', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: true,
        adultsAttending: 2,
        childrenAttending: 1,
      })

      rsvp.updateAttendance({
        isAttending: false,
        adultsAttending: 0,
        childrenAttending: 0,
      })

      expect(rsvp.isAttending).toBe(false)
      expect(rsvp.adultsAttending).toBe(0)
      expect(rsvp.childrenAttending).toBe(0)
    })

    it('should update the updatedAt timestamp when modified', () => {
      const rsvp = RSVP.create({
        inviteId: 'invite-123',
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
      })

      const originalUpdatedAt = rsvp.updatedAt

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        rsvp.updateAttendance({
          isAttending: true,
          adultsAttending: 2,
          childrenAttending: 0,
        })

        expect(rsvp.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime()
        )
      }, 10)
    })
  })
})
