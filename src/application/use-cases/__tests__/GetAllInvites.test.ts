import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetAllInvites } from '../GetAllInvites'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'
import type { Invite } from '@/domain/entities/Invite'
import type { RSVP } from '@/domain/entities/RSVP'

const createMockInvite = (id: string, token: string): Invite =>
  ({
    id,
    token,
    groupName: null,
    adultsCount: 1,
    childrenCount: 0,
    plusOneAllowed: false,
    guests: [
      {
        id: `guest-${id}`,
        name: 'Test Guest',
        email: 'test@example.com',
        isPlusOne: false,
        isChild: false,
        isInviteLead: true,
      },
    ],
    sentAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }) as Invite

const createMockRSVP = (id: string, inviteId: string): RSVP =>
  ({
    id,
    inviteId,
    isAttending: true,
    adultsAttending: 1,
    childrenAttending: 0,
    dietaryRequirements: null,
    respondedAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  }) as RSVP

describe('GetAllInvites', () => {
  let inviteRepository: InviteRepository
  let rsvpRepository: RSVPRepository
  let mealOptionRepository: MealOptionRepository
  let customQuestionRepository: CustomQuestionRepository
  let mealSelectionRepository: MealSelectionRepository
  let questionResponseRepository: QuestionResponseRepository
  let useCase: GetAllInvites

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

    vi.mocked(mealOptionRepository.findAll).mockResolvedValue([])
    vi.mocked(customQuestionRepository.findAllOrdered).mockResolvedValue([])
    vi.mocked(mealSelectionRepository.findByGuestId).mockResolvedValue([])
    vi.mocked(questionResponseRepository.findByRSVPId).mockResolvedValue([])

    useCase = new GetAllInvites(
      inviteRepository,
      rsvpRepository,
      mealOptionRepository,
      customQuestionRepository,
      mealSelectionRepository,
      questionResponseRepository
    )
  })

  it('should use batch fetch for RSVPs instead of individual queries', async () => {
    const invites = [
      createMockInvite('invite-1', 'token-1'),
      createMockInvite('invite-2', 'token-2'),
      createMockInvite('invite-3', 'token-3'),
    ]

    const rsvpMap = new Map<string, RSVP>([
      ['invite-1', createMockRSVP('rsvp-1', 'invite-1')],
      ['invite-3', createMockRSVP('rsvp-3', 'invite-3')],
    ])

    vi.mocked(inviteRepository.findAll).mockResolvedValue(invites)
    vi.mocked(rsvpRepository.findByInviteIds).mockResolvedValue(rsvpMap)

    const result = await useCase.execute()

    expect(rsvpRepository.findByInviteIds).toHaveBeenCalledTimes(1)
    expect(rsvpRepository.findByInviteIds).toHaveBeenCalledWith([
      'invite-1',
      'invite-2',
      'invite-3',
    ])

    expect(rsvpRepository.findByInviteId).not.toHaveBeenCalled()

    expect(result).toHaveLength(3)
    expect(result[0].rsvpStatus.hasResponded).toBe(true)
    expect(result[1].rsvpStatus.hasResponded).toBe(false)
    expect(result[2].rsvpStatus.hasResponded).toBe(true)
  })

  it('should return correct DTO structure with RSVP data', async () => {
    const invite = createMockInvite('invite-1', 'token-1')
    const rsvp = createMockRSVP('rsvp-1', 'invite-1')

    vi.mocked(inviteRepository.findAll).mockResolvedValue([invite])
    vi.mocked(rsvpRepository.findByInviteIds).mockResolvedValue(
      new Map([['invite-1', rsvp]])
    )

    const [result] = await useCase.execute()

    expect(result).toEqual({
      id: 'invite-1',
      token: 'token-1',
      groupName: null,
      adultsCount: 1,
      childrenCount: 0,
      plusOneAllowed: false,
      guests: [
        {
          id: 'guest-invite-1',
          name: 'Test Guest',
          email: 'test@example.com',
          isPlusOne: false,
          isChild: false,
          isInviteLead: true,
        },
      ],
      sentAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      rsvpStatus: {
        hasResponded: true,
        rsvpId: 'rsvp-1',
        isAttending: true,
        adultsAttending: 1,
        childrenAttending: 0,
        respondedAt: '2024-01-02T00:00:00.000Z',
      },
      completeness: {
        needsFollowUp: false,
        expectedMealSelections: 0,
        actualMealSelections: 0,
        missingMealSelections: 0,
        expectedRequiredAnswers: 0,
        actualRequiredAnswers: 0,
        missingRequiredAnswers: 0,
        isComplete: true,
      },
    })
  })

  it('should handle empty invite list', async () => {
    vi.mocked(inviteRepository.findAll).mockResolvedValue([])
    vi.mocked(rsvpRepository.findByInviteIds).mockResolvedValue(new Map())

    const result = await useCase.execute()

    expect(result).toEqual([])
    expect(rsvpRepository.findByInviteIds).toHaveBeenCalledWith([])
  })

  it('should handle invites with no RSVPs', async () => {
    const invites = [
      createMockInvite('invite-1', 'token-1'),
      createMockInvite('invite-2', 'token-2'),
    ]

    vi.mocked(inviteRepository.findAll).mockResolvedValue(invites)
    vi.mocked(rsvpRepository.findByInviteIds).mockResolvedValue(new Map())

    const result = await useCase.execute()

    expect(result).toHaveLength(2)
    expect(result[0].rsvpStatus.hasResponded).toBe(false)
    expect(result[0].rsvpStatus.isAttending).toBeNull()
    expect(result[1].rsvpStatus.hasResponded).toBe(false)
  })
})
