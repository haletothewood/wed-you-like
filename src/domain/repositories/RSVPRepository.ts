import { RSVP } from '../entities/RSVP'

export interface RSVPRepository {
  save(rsvp: RSVP): Promise<void>
  findByInviteId(inviteId: string): Promise<RSVP | null>
  findByInviteIds(inviteIds: string[]): Promise<Map<string, RSVP>>
  findById(id: string): Promise<RSVP | null>
}
