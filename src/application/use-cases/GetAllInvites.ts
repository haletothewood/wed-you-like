import type { Invite } from '@/domain/entities/Invite'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'

export interface InviteDTO {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Array<{ id: string; name: string; email: string }>
  sentAt: string | null
  createdAt: string
}

export class GetAllInvites {
  constructor(private inviteRepository: InviteRepository) {}

  async execute(): Promise<InviteDTO[]> {
    const invites = await this.inviteRepository.findAll()
    return invites.map((invite) => this.toDTO(invite))
  }

  private toDTO(invite: Invite): InviteDTO {
    return {
      id: invite.id,
      token: invite.token,
      groupName: invite.groupName,
      adultsCount: invite.adultsCount,
      childrenCount: invite.childrenCount,
      plusOneAllowed: invite.plusOneAllowed,
      guests: invite.guests,
      sentAt: invite.sentAt?.toISOString() || null,
      createdAt: invite.createdAt.toISOString(),
    }
  }
}
