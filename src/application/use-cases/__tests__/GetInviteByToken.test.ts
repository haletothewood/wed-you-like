import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetInviteByToken } from '@/application/use-cases/GetInviteByToken'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'

describe('GetInviteByToken', () => {
  let inviteRepository: InviteRepository
  let rsvpRepository: RSVPRepository
  let mealOptionRepository: MealOptionRepository
  let customQuestionRepository: CustomQuestionRepository
  let mealSelectionRepository: MealSelectionRepository
  let questionResponseRepository: QuestionResponseRepository
  let useCase: GetInviteByToken

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
      findByInviteId: vi.fn(),
      findByInviteIds: vi.fn(),
      findById: vi.fn(),
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

    useCase = new GetInviteByToken(
      inviteRepository,
      rsvpRepository,
      mealOptionRepository,
      customQuestionRepository,
      mealSelectionRepository,
      questionResponseRepository
    )
  })

  it('returns existing RSVP selections and omits guest contact details from the public payload', async () => {
    vi.mocked(inviteRepository.findByToken).mockResolvedValue({
      id: 'invite-1',
      token: 'token-123',
      groupName: 'Smith Family',
      adultsCount: 2,
      childrenCount: 0,
      plusOneAllowed: true,
      guests: [
        {
          id: 'guest-1',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '123',
          isPlusOne: false,
          isChild: false,
          isInviteLead: true,
        },
        {
          id: 'plus-one-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '456',
          isPlusOne: true,
          isChild: false,
          isInviteLead: false,
        },
      ],
    } as never)
    vi.mocked(rsvpRepository.findByInviteId).mockResolvedValue({
      id: 'rsvp-1',
      isAttending: true,
      adultsAttending: 2,
      childrenAttending: 0,
      dietaryRequirements: 'Vegetarian',
      selectedGuestIds: ['guest-1', 'plus-one-1'],
    } as never)
    vi.mocked(mealOptionRepository.findAll).mockResolvedValue([
      {
        id: 'meal-1',
        courseType: 'MAIN',
        name: 'Risotto',
        description: 'Mushroom',
        isAvailable: true,
      },
    ] as never)
    vi.mocked(customQuestionRepository.findAllOrdered).mockResolvedValue([
      {
        id: 'question-1',
        questionText: 'Song request',
        questionType: 'TEXT',
        options: [],
        isRequired: true,
      },
    ] as never)
    vi.mocked(mealSelectionRepository.findByGuestId)
      .mockResolvedValueOnce([
        {
          guestId: 'guest-1',
          mealOptionId: 'meal-1',
          courseType: 'MAIN',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          guestId: 'plus-one-1',
          mealOptionId: 'meal-1',
          courseType: 'MAIN',
        },
      ] as never)
    vi.mocked(questionResponseRepository.findByRSVPId).mockResolvedValue([
      {
        questionId: 'question-1',
        responseText: 'Dancing Queen',
      },
    ] as never)

    const result = await useCase.execute('token-123')

    expect(result).not.toBeNull()
    expect(result?.guests).toEqual([
      {
        id: 'guest-1',
        name: 'John Smith',
        isPlusOne: false,
        isChild: false,
        isInviteLead: true,
      },
      {
        id: 'plus-one-1',
        name: 'Jane Doe',
        isPlusOne: true,
        isChild: false,
        isInviteLead: false,
      },
    ])
    expect(result?.rsvp).toEqual({
      isAttending: true,
      adultsAttending: 2,
      childrenAttending: 0,
      dietaryRequirements: 'Vegetarian',
      selectedGuestIds: ['guest-1', 'plus-one-1'],
      mealSelections: [
        {
          guestId: 'guest-1',
          mealOptionId: 'meal-1',
          courseType: 'MAIN',
        },
        {
          guestId: 'plus-one-1',
          mealOptionId: 'meal-1',
          courseType: 'MAIN',
        },
      ],
      questionResponses: [
        {
          questionId: 'question-1',
          responseText: 'Dancing Queen',
        },
      ],
    })
  })
})
