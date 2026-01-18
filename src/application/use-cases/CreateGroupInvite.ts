import { Invite } from '@/domain/entities/Invite'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'

export interface CreateGroupInviteRequest {
  groupName: string
  adultsCount: number
  childrenCount: number
  guests: Array<{ name: string; email: string }>
}

export interface CreateGroupInviteResponse {
  id: string
  token: string
}

export class CreateGroupInvite {
  constructor(private inviteRepository: InviteRepository) {}

  async execute(
    request: CreateGroupInviteRequest
  ): Promise<CreateGroupInviteResponse> {
    const invite = Invite.createGroup({
      groupName: request.groupName,
      adultsCount: request.adultsCount,
      childrenCount: request.childrenCount,
      guests: request.guests,
    })

    await this.inviteRepository.save(invite)

    return {
      id: invite.id,
      token: invite.token,
    }
  }
}
