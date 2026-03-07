import { Invite } from '@/domain/entities/Invite'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'

export interface CreateGroupInviteRequest {
  groupName: string
  guests: Array<{
    id: string
    name: string
    email: string
    phone?: string
    isChild: boolean
    parentGuestId?: string
    isInviteLead?: boolean
  }>
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
      guests: request.guests,
    })

    await this.inviteRepository.save(invite)

    return {
      id: invite.id,
      token: invite.token,
    }
  }
}
