import { RSVP } from '@/domain/entities/RSVP'
import { MealSelection } from '@/domain/entities/MealSelection'
import { QuestionResponse } from '@/domain/entities/QuestionResponse'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'
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
  mealSelections?: MealSelectionInput[]
  questionResponses?: QuestionResponseInput[]
}

export interface SubmitRSVPResponse {
  success: boolean
  rsvpId: string
}

export class SubmitRSVP {
  constructor(
    private inviteRepository: InviteRepository,
    private rsvpRepository: RSVPRepository,
    private mealSelectionRepository: MealSelectionRepository,
    private questionResponseRepository: QuestionResponseRepository
  ) {}

  async execute(request: SubmitRSVPRequest): Promise<SubmitRSVPResponse> {
    // Find the invite by token
    const invite = await this.inviteRepository.findByToken(request.token)

    if (!invite) {
      throw new Error('Invite not found')
    }

    // Validate attendee counts against invite
    const totalRequested =
      request.adultsAttending + request.childrenAttending
    const totalAllowed = invite.adultsCount + invite.childrenCount

    if (request.isAttending && totalRequested > totalAllowed) {
      throw new Error(
        `Cannot have more than ${totalAllowed} attendees for this invite`
      )
    }

    // Check if RSVP already exists
    const existingRSVP = await this.rsvpRepository.findByInviteId(invite.id)

    let rsvpId: string

    if (existingRSVP) {
      // Update existing RSVP
      existingRSVP.updateAttendance({
        isAttending: request.isAttending,
        adultsAttending: request.adultsAttending,
        childrenAttending: request.childrenAttending,
        dietaryRequirements: request.dietaryRequirements,
      })

      await this.rsvpRepository.save(existingRSVP)
      rsvpId = existingRSVP.id
    } else {
      // Create new RSVP
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

    // Handle meal selections (only if attending)
    if (request.isAttending && request.mealSelections) {
      // Delete existing meal selections for all guests
      for (const guest of invite.guests) {
        await this.mealSelectionRepository.deleteByGuestId(guest.id)
      }

      // Create new meal selections
      const mealSelections = request.mealSelections.map((selection) =>
        MealSelection.create({
          guestId: selection.guestId,
          mealOptionId: selection.mealOptionId,
          courseType: selection.courseType,
        })
      )

      await this.mealSelectionRepository.saveMany(mealSelections)
    }

    // Handle question responses (only if attending)
    if (request.isAttending && request.questionResponses) {
      // Delete existing question responses
      await this.questionResponseRepository.deleteByRSVPId(rsvpId)

      // Create new question responses
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
    }

    return {
      success: true,
      rsvpId,
    }
  }
}
