import { nanoid } from 'nanoid'
import { RSVP } from '@/domain/entities/RSVP'
import { MealSelection } from '@/domain/entities/MealSelection'
import { QuestionResponse } from '@/domain/entities/QuestionResponse'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'
import type { GuestRepository } from '@/domain/repositories/GuestRepository'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'
import type { CourseType } from '@/domain/entities/MealOption'

export interface MealSelectionInput {
  guestId: string
  mealOptionId: string
  courseType: CourseType
}

export interface QuestionResponseInput {
  questionId: string
  responseText: string
}

export interface SubmitRSVPRequest {
  token: string
  isAttending: boolean
  adultsAttending: number
  childrenAttending: number
  dietaryRequirements?: string
  plusOneName?: string
  mealSelections?: MealSelectionInput[]
  questionResponses?: QuestionResponseInput[]
}

export interface SubmitRSVPResponse {
  success: boolean
  rsvpId: string
  plusOneGuestId?: string
}

export class SubmitRSVP {
  constructor(
    private inviteRepository: InviteRepository,
    private rsvpRepository: RSVPRepository,
    private mealSelectionRepository: MealSelectionRepository,
    private questionResponseRepository: QuestionResponseRepository,
    private guestRepository?: GuestRepository,
    private mealOptionRepository?: MealOptionRepository,
    private customQuestionRepository?: CustomQuestionRepository
  ) {}

  async execute(request: SubmitRSVPRequest): Promise<SubmitRSVPResponse> {
    const invite = await this.inviteRepository.findByToken(request.token)

    if (!invite) {
      throw new Error('Invite not found')
    }

    const hasPlusOne = !!request.plusOneName?.trim()

    if (hasPlusOne && !invite.plusOneAllowed) {
      throw new Error('Plus one is not allowed for this invite')
    }

    const baseAllowed = invite.adultsCount + invite.childrenCount
    const totalAllowed = invite.plusOneAllowed ? baseAllowed + 1 : baseAllowed
    const totalRequested = request.adultsAttending + request.childrenAttending

    if (request.isAttending && totalRequested > totalAllowed) {
      throw new Error(
        `Cannot have more than ${totalAllowed} attendees for this invite`
      )
    }

    let plusOneGuestId: string | undefined
    let existingPlusOneGuestId: string | undefined

    if (this.guestRepository) {
      const existingPlusOne = await this.guestRepository.findPlusOneByInviteId(invite.id)
      existingPlusOneGuestId = existingPlusOne?.id

      if (hasPlusOne && request.isAttending) {
        if (existingPlusOne) {
          existingPlusOne.name = request.plusOneName!.trim()
          await this.guestRepository.save(existingPlusOne)
          plusOneGuestId = existingPlusOne.id
        } else {
          const newPlusOne = {
            id: nanoid(),
            name: request.plusOneName!.trim(),
            email: '',
            phone: '',
            inviteId: invite.id,
            isPlusOne: true,
            isChild: false,
            parentGuestId: undefined,
            isInviteLead: false,
          }
          const saved = await this.guestRepository.save(newPlusOne)
          plusOneGuestId = saved.id
        }
      } else if (existingPlusOne) {
        await this.mealSelectionRepository.deleteByGuestId(existingPlusOne.id)
        await this.guestRepository.delete(existingPlusOne.id)
      }
    }

    const existingRSVP = await this.rsvpRepository.findByInviteId(invite.id)

    let rsvpId: string

    if (existingRSVP) {
      existingRSVP.updateAttendance({
        isAttending: request.isAttending,
        adultsAttending: request.adultsAttending,
        childrenAttending: request.childrenAttending,
        dietaryRequirements: request.dietaryRequirements,
      })

      await this.rsvpRepository.save(existingRSVP)
      rsvpId = existingRSVP.id
    } else {
      const rsvp = RSVP.create({
        inviteId: invite.id,
        isAttending: request.isAttending,
        adultsAttending: request.adultsAttending,
        childrenAttending: request.childrenAttending,
        dietaryRequirements: request.dietaryRequirements,
      })

      await this.rsvpRepository.save(rsvp)
      rsvpId = rsvp.id
    }

    const guestIdsToClear = new Set(invite.guests.map((guest) => guest.id))
    if (plusOneGuestId) {
      guestIdsToClear.add(plusOneGuestId)
    } else if (existingPlusOneGuestId) {
      guestIdsToClear.add(existingPlusOneGuestId)
    }

    const clearMealSelections = async () => {
      for (const guestId of guestIdsToClear) {
        await this.mealSelectionRepository.deleteByGuestId(guestId)
      }
    }

    if (!request.isAttending) {
      await clearMealSelections()
      await this.questionResponseRepository.deleteByRSVPId(rsvpId)

      return {
        success: true,
        rsvpId,
        plusOneGuestId,
      }
    }

    if (request.isAttending && request.mealSelections) {
      const inviteGuestIds = new Set(invite.guests.map((guest) => guest.id))
      const allowedGuestIds = new Set(inviteGuestIds)
      if (plusOneGuestId) {
        allowedGuestIds.add(plusOneGuestId)
      }

      const seenGuestCoursePairs = new Set<string>()

      if (this.mealOptionRepository) {
        for (const selection of request.mealSelections) {
          const guestId =
            selection.guestId === 'PLUS_ONE'
              ? plusOneGuestId
              : selection.guestId

          if (!guestId) {
            throw new Error('Invalid plus-one meal selection')
          }

          if (!allowedGuestIds.has(guestId)) {
            throw new Error('Meal selection contains a guest not in this invite')
          }

          const guestCourseKey = `${guestId}:${selection.courseType}`
          if (seenGuestCoursePairs.has(guestCourseKey)) {
            throw new Error('Duplicate meal selection for guest course')
          }
          seenGuestCoursePairs.add(guestCourseKey)

          const mealOption = await this.mealOptionRepository.findById(
            selection.mealOptionId
          )
          if (!mealOption) {
            throw new Error('Meal selection contains an unknown meal option')
          }

          if (!mealOption.isAvailable) {
            throw new Error('Meal selection contains an unavailable meal option')
          }

          if (mealOption.courseType !== selection.courseType) {
            throw new Error('Meal selection course type does not match meal option')
          }
        }
      }

      await clearMealSelections()

      const mealSelections = request.mealSelections.map((selection) => {
        const guestId = selection.guestId === 'PLUS_ONE' && plusOneGuestId
          ? plusOneGuestId
          : selection.guestId
        return MealSelection.create({
          guestId,
          mealOptionId: selection.mealOptionId,
          courseType: selection.courseType,
        })
      })

      await this.mealSelectionRepository.saveMany(mealSelections)
    } else if (request.isAttending) {
      await clearMealSelections()
    }

    if (request.isAttending && request.questionResponses) {
      if (this.customQuestionRepository) {
        const allowedQuestions = await this.customQuestionRepository.findAll()
        const allowedQuestionIds = new Set(allowedQuestions.map((q) => q.id))

        for (const response of request.questionResponses) {
          if (!allowedQuestionIds.has(response.questionId)) {
            throw new Error('Question response contains an unknown question')
          }
        }
      }

      await this.questionResponseRepository.deleteByRSVPId(rsvpId)

      const questionResponses = request.questionResponses
        .filter((response) => response.responseText.trim() !== '')
        .map((response) =>
          QuestionResponse.create({
            rsvpId,
            questionId: response.questionId,
            responseText: response.responseText,
          })
        )

      await this.questionResponseRepository.saveMany(questionResponses)
    } else if (request.isAttending) {
      await this.questionResponseRepository.deleteByRSVPId(rsvpId)
    }

    return {
      success: true,
      rsvpId,
      plusOneGuestId,
    }
  }
}
