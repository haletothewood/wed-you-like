import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  createIndividualInviteSchema,
  createGroupInviteSchema,
  submitRsvpSchema,
  loginSchema,
} from '../schemas'

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com')
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email')
      expect(result.success).toBe(false)
    })

    it('should reject empty string', () => {
      const result = emailSchema.safeParse('')
      expect(result.success).toBe(false)
    })
  })

  describe('createIndividualInviteSchema', () => {
    it('should accept valid individual invite', () => {
      const result = createIndividualInviteSchema.safeParse({
        type: 'individual',
        guestName: 'John Smith',
        email: 'john@example.com',
        plusOneAllowed: false,
      })
      expect(result.success).toBe(true)
    })

    it('should default plusOneAllowed to false', () => {
      const result = createIndividualInviteSchema.safeParse({
        type: 'individual',
        guestName: 'John Smith',
        email: 'john@example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.plusOneAllowed).toBe(false)
      }
    })

    it('should reject empty guest name', () => {
      const result = createIndividualInviteSchema.safeParse({
        type: 'individual',
        guestName: '',
        email: 'john@example.com',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const result = createIndividualInviteSchema.safeParse({
        type: 'individual',
        guestName: 'John Smith',
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })

    it('should reject wrong type', () => {
      const result = createIndividualInviteSchema.safeParse({
        type: 'group',
        guestName: 'John Smith',
        email: 'john@example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createGroupInviteSchema', () => {
    it('should accept valid group invite', () => {
      const result = createGroupInviteSchema.safeParse({
        type: 'group',
        groupName: 'The Smiths',
        adultsCount: 2,
        childrenCount: 1,
        guests: [
          { name: 'John Smith', email: 'john@example.com' },
          { name: 'Jane Smith', email: '' },
          { name: 'Billy Smith', email: '' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative adults count', () => {
      const result = createGroupInviteSchema.safeParse({
        type: 'group',
        groupName: 'The Smiths',
        adultsCount: -1,
        childrenCount: 0,
        guests: [{ name: 'John', email: 'john@example.com' }],
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty group name', () => {
      const result = createGroupInviteSchema.safeParse({
        type: 'group',
        groupName: '',
        adultsCount: 2,
        childrenCount: 0,
        guests: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: '' },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty guests array', () => {
      const result = createGroupInviteSchema.safeParse({
        type: 'group',
        groupName: 'The Smiths',
        adultsCount: 2,
        childrenCount: 0,
        guests: [],
      })
      expect(result.success).toBe(false)
    })

    it('should require at least one guest with email', () => {
      const result = createGroupInviteSchema.safeParse({
        type: 'group',
        groupName: 'The Smiths',
        adultsCount: 2,
        childrenCount: 0,
        guests: [
          { name: 'John', email: '' },
          { name: 'Jane', email: '' },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('submitRsvpSchema', () => {
    it('should accept valid RSVP submission (attending)', () => {
      const result = submitRsvpSchema.safeParse({
        isAttending: true,
        adultsAttending: 2,
        childrenAttending: 1,
        dietaryRequirements: 'Vegetarian',
        mealSelections: [
          { guestId: 'guest-1', mealOptionId: 'meal-1', courseType: 'STARTER' },
        ],
        questionResponses: [
          { questionId: 'q-1', responseText: 'Yes' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid RSVP submission (not attending)', () => {
      const result = submitRsvpSchema.safeParse({
        isAttending: false,
        adultsAttending: 0,
        childrenAttending: 0,
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative attendee counts', () => {
      const result = submitRsvpSchema.safeParse({
        isAttending: true,
        adultsAttending: -1,
        childrenAttending: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid course type in meal selections', () => {
      const result = submitRsvpSchema.safeParse({
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
        mealSelections: [
          { guestId: 'guest-1', mealOptionId: 'meal-1', courseType: 'INVALID' },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should default optional fields', () => {
      const result = submitRsvpSchema.safeParse({
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.dietaryRequirements).toBeUndefined()
        expect(result.data.mealSelections).toBeUndefined()
        expect(result.data.questionResponses).toBeUndefined()
      }
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const result = loginSchema.safeParse({
        username: 'admin',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty username', () => {
      const result = loginSchema.safeParse({
        username: '',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        username: 'admin',
        password: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('should trim username', () => {
      const result = loginSchema.safeParse({
        username: '  admin  ',
        password: 'password123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.username).toBe('admin')
      }
    })
  })
})
