import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
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
  guests: Array<{ id: string; name: string; email: string }>
  hasResponded: boolean
  rsvp?: {
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
    dietaryRequirements: string | null
  }
  mealOptions: MealOptionDTO[]
  customQuestions: CustomQuestionDTO[]
}

export class GetInviteByToken {
  constructor(
    private inviteRepository: InviteRepository,
    private rsvpRepository: RSVPRepository,
    private mealOptionRepository: MealOptionRepository,
    private customQuestionRepository: CustomQuestionRepository
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
      guests: invite.guests,
      hasResponded: existingRSVP !== null,
      rsvp: existingRSVP
        ? {
            isAttending: existingRSVP.isAttending,
            adultsAttending: existingRSVP.adultsAttending,
            childrenAttending: existingRSVP.childrenAttending,
            dietaryRequirements: existingRSVP.dietaryRequirements,
          }
        : undefined,
      mealOptions: availableMealOptions,
      customQuestions,
    }
  }
}
