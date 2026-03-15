import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'
import type { CourseType } from '@/domain/entities/MealOption'
import type { QuestionType } from '@/domain/entities/CustomQuestion'

export interface MealOptionDTO {
  id: string
  courseType: CourseType
  name: string
  description: string | null
}

export interface CustomQuestionDTO {
  id: string
  questionText: string
  questionType: QuestionType
  options: string[]
  isRequired: boolean
}

export interface InviteDetailsDTO {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Array<{
    id: string
    name: string
    isPlusOne: boolean
    isChild: boolean
    parentGuestId?: string
    isInviteLead: boolean
  }>
  hasResponded: boolean
  rsvp?: {
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
    dietaryRequirements: string | null
    selectedGuestIds: string[]
    mealSelections: Array<{
      guestId: string
      mealOptionId: string
      courseType: CourseType
    }>
    questionResponses: Array<{
      questionId: string
      responseText: string
    }>
  }
  mealOptions: MealOptionDTO[]
  customQuestions: CustomQuestionDTO[]
}

export class GetInviteByToken {
  constructor(
    private inviteRepository: InviteRepository,
    private rsvpRepository: RSVPRepository,
    private mealOptionRepository: MealOptionRepository,
    private customQuestionRepository: CustomQuestionRepository,
    private mealSelectionRepository: MealSelectionRepository,
    private questionResponseRepository: QuestionResponseRepository
  ) {}

  async execute(token: string): Promise<InviteDetailsDTO | null> {
    const invite = await this.inviteRepository.findByToken(token)

    if (!invite) {
      return null
    }

    const [existingRSVP, allMealOptions, allQuestions] = await Promise.all([
      this.rsvpRepository.findByInviteId(invite.id),
      this.mealOptionRepository.findAll(),
      this.customQuestionRepository.findAllOrdered(),
    ])

    const [existingMealSelections, existingQuestionResponses] = existingRSVP
      ? await Promise.all([
          Promise.all(
            invite.guests.map(async (guest) => this.mealSelectionRepository.findByGuestId(guest.id))
          ).then((results) => results.flat()),
          this.questionResponseRepository.findByRSVPId(existingRSVP.id),
        ])
      : [[], []]

    const availableMealOptions = allMealOptions
      .filter((option) => option.isAvailable)
      .map((option) => ({
        id: option.id,
        courseType: option.courseType,
        name: option.name,
        description: option.description,
      }))

    const customQuestions = allQuestions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options,
      isRequired: question.isRequired,
    }))

    return {
      id: invite.id,
      token: invite.token,
      groupName: invite.groupName,
      adultsCount: invite.adultsCount,
      childrenCount: invite.childrenCount,
      plusOneAllowed: invite.plusOneAllowed,
      guests: invite.guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        isPlusOne: guest.isPlusOne,
        isChild: guest.isChild,
        parentGuestId: guest.parentGuestId,
        isInviteLead: guest.isInviteLead,
      })),
      hasResponded: existingRSVP !== null,
      rsvp: existingRSVP
        ? {
            isAttending: existingRSVP.isAttending,
            adultsAttending: existingRSVP.adultsAttending,
            childrenAttending: existingRSVP.childrenAttending,
            dietaryRequirements: existingRSVP.dietaryRequirements,
            selectedGuestIds: existingRSVP.selectedGuestIds,
            mealSelections: existingMealSelections.map((selection) => ({
              guestId: selection.guestId,
              mealOptionId: selection.mealOptionId,
              courseType: selection.courseType,
            })),
            questionResponses: existingQuestionResponses.map((response) => ({
              questionId: response.questionId,
              responseText: response.responseText,
            })),
          }
        : undefined,
      mealOptions: availableMealOptions,
      customQuestions,
    }
  }
}
