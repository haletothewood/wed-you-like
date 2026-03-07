import type { Invite } from '@/domain/entities/Invite'
import type { RSVP } from '@/domain/entities/RSVP'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'

export interface InviteDTO {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Array<{
    id: string
    name: string
    email: string
    phone: string
    isPlusOne: boolean
    isChild: boolean
    parentGuestId?: string
    isInviteLead: boolean
  }>
  sentAt: string | null
  sentVia: 'email' | 'whatsapp' | null
  createdAt: string
  rsvpStatus: {
    hasResponded: boolean
    rsvpId: string | null
    isAttending: boolean | null
    adultsAttending: number | null
    childrenAttending: number | null
    respondedAt: string | null
  }
  completeness: {
    needsFollowUp: boolean
    expectedMealSelections: number
    actualMealSelections: number
    missingMealSelections: number
    expectedRequiredAnswers: number
    actualRequiredAnswers: number
    missingRequiredAnswers: number
    isComplete: boolean
  }
}

export class GetAllInvites {
  constructor(
    private inviteRepository: InviteRepository,
    private rsvpRepository: RSVPRepository,
    private mealOptionRepository: MealOptionRepository,
    private customQuestionRepository: CustomQuestionRepository,
    private mealSelectionRepository: MealSelectionRepository,
    private questionResponseRepository: QuestionResponseRepository
  ) {}

  async execute(): Promise<InviteDTO[]> {
    const invites = await this.inviteRepository.findAll()

    const inviteIds = invites.map((invite) => invite.id)
    const rsvpMap = await this.rsvpRepository.findByInviteIds(inviteIds)
    const [mealOptions, customQuestions] = await Promise.all([
      this.mealOptionRepository.findAll(),
      this.customQuestionRepository.findAllOrdered(),
    ])
    const requiredQuestionIds = new Set(
      customQuestions.filter((question) => question.isRequired).map((question) => question.id)
    )
    const availableCourseTypes = new Set(
      mealOptions.filter((mealOption) => mealOption.isAvailable).map((mealOption) => mealOption.courseType)
    )
    const requiredQuestionCount = requiredQuestionIds.size
    const mealCourseCount = availableCourseTypes.size

    const inviteDtos = await Promise.all(invites.map(async (invite) => {
      const rsvp = rsvpMap.get(invite.id) ?? null
      const baseDto = this.toDTO(invite, rsvp)

      if (!rsvp || !rsvp.isAttending) {
        return {
          ...baseDto,
          completeness: {
            needsFollowUp: Boolean(invite.sentAt) && !baseDto.rsvpStatus.hasResponded,
            expectedMealSelections: 0,
            actualMealSelections: 0,
            missingMealSelections: 0,
            expectedRequiredAnswers: 0,
            actualRequiredAnswers: 0,
            missingRequiredAnswers: 0,
            isComplete: baseDto.rsvpStatus.hasResponded,
          },
        }
      }

      const expectedAttendingCount = rsvp.adultsAttending + rsvp.childrenAttending
      const expectedMealSelections = expectedAttendingCount * mealCourseCount

      let actualMealSelections = 0
      for (const guest of invite.guests) {
        const mealSelections = await this.mealSelectionRepository.findByGuestId(guest.id)
        actualMealSelections += mealSelections.length
      }

      const questionResponses = await this.questionResponseRepository.findByRSVPId(rsvp.id)
      const answeredRequiredIds = new Set(
        questionResponses
          .filter((response) => requiredQuestionIds.has(response.questionId) && response.responseText.trim() !== '')
          .map((response) => response.questionId)
      )

      const actualRequiredAnswers = answeredRequiredIds.size
      const missingMealSelections = Math.max(expectedMealSelections - actualMealSelections, 0)
      const missingRequiredAnswers = Math.max(requiredQuestionCount - actualRequiredAnswers, 0)

      return {
        ...baseDto,
        completeness: {
          needsFollowUp: Boolean(invite.sentAt) && !baseDto.rsvpStatus.hasResponded,
          expectedMealSelections,
          actualMealSelections,
          missingMealSelections,
          expectedRequiredAnswers: requiredQuestionCount,
          actualRequiredAnswers,
          missingRequiredAnswers,
          isComplete: missingMealSelections === 0 && missingRequiredAnswers === 0,
        },
      }
    }))

    return inviteDtos
  }

  private toDTO(invite: Invite, rsvp: RSVP | null): InviteDTO {
    return {
      id: invite.id,
      token: invite.token,
      groupName: invite.groupName,
      adultsCount: invite.adultsCount,
      childrenCount: invite.childrenCount,
      plusOneAllowed: invite.plusOneAllowed,
      guests: invite.guests,
      sentAt: invite.sentAt?.toISOString() || null,
      sentVia: invite.sentVia,
      createdAt: invite.createdAt.toISOString(),
      rsvpStatus: {
        hasResponded: !!rsvp,
        rsvpId: rsvp?.id ?? null,
        isAttending: rsvp?.isAttending ?? null,
        adultsAttending: rsvp?.adultsAttending ?? null,
        childrenAttending: rsvp?.childrenAttending ?? null,
        respondedAt: rsvp?.respondedAt?.toISOString() ?? null,
      },
      completeness: {
        needsFollowUp: Boolean(invite.sentAt) && !rsvp,
        expectedMealSelections: 0,
        actualMealSelections: 0,
        missingMealSelections: 0,
        expectedRequiredAnswers: 0,
        actualRequiredAnswers: 0,
        missingRequiredAnswers: 0,
        isComplete: false,
      },
    }
  }
}
