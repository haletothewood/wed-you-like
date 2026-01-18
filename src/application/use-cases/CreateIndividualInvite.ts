import { Invite } from '@/domain/entities/Invite'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'

export interface CreateIndividualInviteRequest {
  guestName: string
  email: string
  plusOneAllowed?: boolean
}

export interface CreateIndividualInviteResponse {
  id: string
  token: string
}

export class CreateIndividualInvite {
  constructor(private inviteRepository: InviteRepository) {}

  async execute(
    request: CreateIndividualInviteRequest
  ): Promise<CreateIndividualInviteResponse> {
    const invite = Invite.createIndividual({
      guestName: request.guestName,
      email: request.email,
      plusOneAllowed: request.plusOneAllowed,
    })

    await this.inviteRepository.save(invite)

    return {
      id: invite.id,
      token: invite.token,
    }
  }
}
