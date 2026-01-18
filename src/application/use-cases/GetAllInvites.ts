import type { Invite } from '@/domain/entities/Invite'
import type { RSVP } from '@/domain/entities/RSVP'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'

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
  rsvpStatus: {
    hasResponded: boolean
    isAttending: boolean | null
    adultsAttending: number | null
    childrenAttending: number | null
    respondedAt: string | null
  }
}

export class GetAllInvites {
  constructor(
    private inviteRepository: InviteRepository,
    private rsvpRepository: RSVPRepository
  ) {}

  async execute(): Promise<InviteDTO[]> {
    const invites = await this.inviteRepository.findAll()

    // Fetch all RSVPs for these invites
    const dtos = await Promise.all(
      invites.map(async (invite) => {
        const rsvp = await this.rsvpRepository.findByInviteId(invite.id)
        return this.toDTO(invite, rsvp)
      })
    )

    return dtos
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
      createdAt: invite.createdAt.toISOString(),
      rsvpStatus: {
        hasResponded: !!rsvp,
        isAttending: rsvp?.isAttending ?? null,
        adultsAttending: rsvp?.adultsAttending ?? null,
        childrenAttending: rsvp?.childrenAttending ?? null,
        respondedAt: rsvp?.respondedAt?.toISOString() ?? null,
      },
    }
  }
}
