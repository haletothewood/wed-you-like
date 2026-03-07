import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubmitRSVP } from '../SubmitRSVP'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'
import type { GuestRepository } from '@/domain/repositories/GuestRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
import type { Invite } from '@/domain/entities/Invite'

const createMockInvite = (overrides: Partial<Invite> = {}): Invite =>
  ({
    id: 'invite-1',
    token: 'token-123',
    groupName: null,
    adultsCount: 1,
    childrenCount: 0,
    plusOneAllowed: false,
    guests: [
      {
        id: 'guest-1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '',
        isPlusOne: false,
        isChild: false,
        isInviteLead: true,
      },
    ],
    sentAt: null,
    sentVia: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Invite

describe('SubmitRSVP', () => {
  let inviteRepository: InviteRepository
  let rsvpRepository: RSVPRepository
  let mealSelectionRepository: MealSelectionRepository
  let questionResponseRepository: QuestionResponseRepository
  let guestRepository: GuestRepository
  let mealOptionRepository: MealOptionRepository
  let customQuestionRepository: CustomQuestionRepository
  let useCase: SubmitRSVP

  beforeEach(() => {
    inviteRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByToken: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      existsByToken: vi.fn(),
    }

    rsvpRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByInviteId: vi.fn(),
      findByInviteIds: vi.fn(),
    }

    mealSelectionRepository = {
      save: vi.fn(),
      saveMany: vi.fn(),
      findByGuestId: vi.fn(),
      deleteByGuestId: vi.fn(),
    }

    questionResponseRepository = {
      save: vi.fn(),
      saveMany: vi.fn(),
      findByRSVPId: vi.fn(),
      deleteByRSVPId: vi.fn(),
    }

    guestRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByInviteId: vi.fn(),
      findPlusOneByInviteId: vi.fn(),
      delete: vi.fn(),
    }

    mealOptionRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByCourseType: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    }

    customQuestionRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllOrdered: vi.fn(),
      delete: vi.fn(),
    }

    useCase = new SubmitRSVP(
      inviteRepository,
      rsvpRepository,
      mealSelectionRepository,
      questionResponseRepository,
      guestRepository,
      mealOptionRepository,
      customQuestionRepository
    )
  })

  describe('plus-one handling', () => {
    it('should allow plus-one when plusOneAllowed is true', async () => {
      const invite = createMockInvite({ plusOneAllowed: true })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.save).mockImplementation(async (guest) => guest)

      const result = await useCase.execute({
        token: 'token-123',
        isAttending: true,
        adultsAttending: 2,
        childrenAttending: 0,
        plusOneName: 'Jane Doe',
      })

      expect(result.success).toBe(true)
      expect(guestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          isPlusOne: true,
        })
      )
    })

    it('should reject plus-one when plusOneAllowed is false', async () => {
      const invite = createMockInvite({ plusOneAllowed: false })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)

      await expect(
        useCase.execute({
          token: 'token-123',
          isAttending: true,
          adultsAttending: 2,
          childrenAttending: 0,
          plusOneName: 'Jane Doe',
        })
      ).rejects.toThrow('Plus one is not allowed for this invite')
    })

    it('should update existing plus-one guest on resubmit', async () => {
      const invite = createMockInvite({ plusOneAllowed: true })
      const existingPlusOne = {
        id: 'plus-one-guest-1',
        name: 'Old Name',
        email: '',
        phone: '',
        inviteId: 'invite-1',
        isPlusOne: true,
        isChild: false,
        isInviteLead: false,
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(existingPlusOne)
      vi.mocked(guestRepository.save).mockImplementation(async (guest) => guest)

      await useCase.execute({
        token: 'token-123',
        isAttending: true,
        adultsAttending: 2,
        childrenAttending: 0,
        plusOneName: 'New Name',
      })

      expect(guestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'plus-one-guest-1',
          name: 'New Name',
        })
      )
    })

    it('should delete plus-one guest when resubmitting without plus-one', async () => {
      const invite = createMockInvite({ plusOneAllowed: true })
      const existingPlusOne = {
        id: 'plus-one-guest-1',
        name: 'Jane Doe',
        email: '',
        phone: '',
        inviteId: 'invite-1',
        isPlusOne: true,
        isChild: false,
        isInviteLead: false,
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(existingPlusOne)

      await useCase.execute({
        token: 'token-123',
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
      })

      expect(guestRepository.delete).toHaveBeenCalledWith('plus-one-guest-1')
      expect(mealSelectionRepository.deleteByGuestId).toHaveBeenCalledWith('plus-one-guest-1')
    })

    it('should save meal selections for plus-one with valid guest ID', async () => {
      const invite = createMockInvite({ plusOneAllowed: true })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.save).mockImplementation(async (guest) => guest)
      vi.mocked(mealOptionRepository.findById).mockResolvedValue({
        id: 'meal-1',
        courseType: 'STARTER',
        isAvailable: true,
      } as never)

      await useCase.execute({
        token: 'token-123',
        isAttending: true,
        adultsAttending: 2,
        childrenAttending: 0,
        plusOneName: 'Jane Doe',
        mealSelections: [
          { guestId: 'PLUS_ONE', mealOptionId: 'meal-1', courseType: 'STARTER' },
        ],
      })

      expect(mealSelectionRepository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mealOptionId: 'meal-1',
          }),
        ])
      )
    })

    it('should include plus-one in attendee count validation', async () => {
      const invite = createMockInvite({
        plusOneAllowed: true,
        adultsCount: 1,
      })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)

      await expect(
        useCase.execute({
          token: 'token-123',
          isAttending: true,
          adultsAttending: 3,
          childrenAttending: 0,
          plusOneName: 'Jane Doe',
        })
      ).rejects.toThrow('Cannot have more than 2 attendees')
    })

    it('should reject meal selection for guest not in invite', async () => {
      const invite = createMockInvite({ plusOneAllowed: false })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(null)
      vi.mocked(mealOptionRepository.findById).mockResolvedValue({
        id: 'meal-1',
        courseType: 'STARTER',
        isAvailable: true,
      } as never)

      await expect(
        useCase.execute({
          token: 'token-123',
          isAttending: true,
          adultsAttending: 1,
          childrenAttending: 0,
          mealSelections: [
            { guestId: 'other-guest', mealOptionId: 'meal-1', courseType: 'STARTER' },
          ],
        })
      ).rejects.toThrow('Meal selection contains a guest not in this invite')
    })

    it('should reject meal selection when course type does not match meal option', async () => {
      const invite = createMockInvite({ plusOneAllowed: false })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(null)
      vi.mocked(mealOptionRepository.findById).mockResolvedValue({
        id: 'meal-1',
        courseType: 'MAIN',
        isAvailable: true,
      } as never)

      await expect(
        useCase.execute({
          token: 'token-123',
          isAttending: true,
          adultsAttending: 1,
          childrenAttending: 0,
          mealSelections: [
            { guestId: 'guest-1', mealOptionId: 'meal-1', courseType: 'STARTER' },
          ],
        })
      ).rejects.toThrow('Meal selection course type does not match meal option')
    })

    it('should reject unknown custom question responses', async () => {
      const invite = createMockInvite({ plusOneAllowed: false })
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(null)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(null)
      vi.mocked(customQuestionRepository.findAll).mockResolvedValue([])

      await expect(
        useCase.execute({
          token: 'token-123',
          isAttending: true,
          adultsAttending: 1,
          childrenAttending: 0,
          questionResponses: [
            { questionId: 'unknown-question', responseText: 'hello' },
          ],
        })
      ).rejects.toThrow('Question response contains an unknown question')
    })

    it('should clear meals and question responses when RSVP changes to not attending', async () => {
      const invite = createMockInvite({
        guests: [
          { id: 'guest-1', name: 'John Smith', email: 'john@example.com', phone: '', isPlusOne: false, isChild: false, isInviteLead: true },
          { id: 'guest-2', name: 'Jane Smith', email: 'jane@example.com', phone: '', isPlusOne: false, isChild: false, isInviteLead: false },
        ],
      })
      const existingRsvp = {
        id: 'rsvp-1',
        updateAttendance: vi.fn(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(existingRsvp as never)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue({
        id: 'plus-one-guest-1',
        name: 'Plus One',
        email: '',
        phone: '',
        inviteId: 'invite-1',
        isPlusOne: true,
        isChild: false,
        isInviteLead: false,
      })

      await useCase.execute({
        token: 'token-123',
        isAttending: false,
        adultsAttending: 0,
        childrenAttending: 0,
      })

      expect(mealSelectionRepository.deleteByGuestId).toHaveBeenCalledWith('guest-1')
      expect(mealSelectionRepository.deleteByGuestId).toHaveBeenCalledWith('guest-2')
      expect(questionResponseRepository.deleteByRSVPId).toHaveBeenCalledWith('rsvp-1')
    })

    it('should clear previous responses when attending submission omits meals and questions', async () => {
      const invite = createMockInvite()
      const existingRsvp = {
        id: 'rsvp-1',
        updateAttendance: vi.fn(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(invite)
      vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue(existingRsvp as never)
      vi.mocked(guestRepository.findPlusOneByInviteId).mockResolvedValue(null)

      await useCase.execute({
        token: 'token-123',
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
      })

      expect(mealSelectionRepository.deleteByGuestId).toHaveBeenCalledWith('guest-1')
      expect(questionResponseRepository.deleteByRSVPId).toHaveBeenCalledWith('rsvp-1')
      expect(mealSelectionRepository.saveMany).not.toHaveBeenCalled()
      expect(questionResponseRepository.saveMany).not.toHaveBeenCalled()
    })
  })
})
