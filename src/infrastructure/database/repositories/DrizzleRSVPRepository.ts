import { eq, inArray } from 'drizzle-orm'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import { RSVP } from '@/domain/entities/RSVP'
import { db } from '../connection'
import { rsvps } from '../schema'

type RSVPDatabase = Pick<typeof db, 'insert' | 'query'>

export class DrizzleRSVPRepository implements RSVPRepository {
  constructor(private database: RSVPDatabase = db) {}

  async save(rsvp: RSVP): Promise<void> {
    await this.database
      .insert(rsvps)
      .values({
        id: rsvp.id,
        inviteId: rsvp.inviteId,
        isAttending: rsvp.isAttending,
        adultsAttending: rsvp.adultsAttending,
        childrenAttending: rsvp.childrenAttending,
        dietaryRequirements: rsvp.dietaryRequirements,
        selectedGuestIds: JSON.stringify(rsvp.selectedGuestIds),
        respondedAt: rsvp.respondedAt,
        createdAt: rsvp.createdAt,
        updatedAt: rsvp.updatedAt,
      })
      .onConflictDoUpdate({
        target: rsvps.id,
        set: {
          isAttending: rsvp.isAttending,
          adultsAttending: rsvp.adultsAttending,
          childrenAttending: rsvp.childrenAttending,
          dietaryRequirements: rsvp.dietaryRequirements,
          selectedGuestIds: JSON.stringify(rsvp.selectedGuestIds),
          updatedAt: rsvp.updatedAt,
        },
      })
  }

  async findByInviteId(inviteId: string): Promise<RSVP | null> {
    const record = await this.database.query.rsvps.findFirst({
      where: eq(rsvps.inviteId, inviteId),
    })

    if (!record) {
      return null
    }

    return this.toDomain(record)
  }

  async findByInviteIds(inviteIds: string[]): Promise<Map<string, RSVP>> {
    if (inviteIds.length === 0) {
      return new Map()
    }

    const records = await this.database.query.rsvps.findMany({
      where: inArray(rsvps.inviteId, inviteIds),
    })

    const result = new Map<string, RSVP>()
    for (const record of records) {
      result.set(record.inviteId, this.toDomain(record))
    }

    return result
  }

  async findById(id: string): Promise<RSVP | null> {
    const record = await this.database.query.rsvps.findFirst({
      where: eq(rsvps.id, id),
    })

    if (!record) {
      return null
    }

    return this.toDomain(record)
  }

  private toDomain(record: {
    id: string
    inviteId: string
    isAttending: boolean
    adultsAttending: number
    childrenAttending: number
    dietaryRequirements: string | null
    selectedGuestIds: string
    respondedAt: Date
    createdAt: Date
    updatedAt: Date
  }): RSVP {
    let selectedGuestIds: string[] = []

    try {
      const parsed = JSON.parse(record.selectedGuestIds)
      if (Array.isArray(parsed)) {
        selectedGuestIds = parsed.filter(
          (guestId): guestId is string => typeof guestId === 'string' && guestId.trim() !== ''
        )
      }
    } catch {
      selectedGuestIds = []
    }

    const rsvp = Object.create(RSVP.prototype)
    rsvp.props = {
      id: record.id,
      inviteId: record.inviteId,
      isAttending: Boolean(record.isAttending),
      adultsAttending: record.adultsAttending,
      childrenAttending: record.childrenAttending,
      dietaryRequirements: record.dietaryRequirements,
      selectedGuestIds,
      respondedAt: record.respondedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return rsvp
  }
}
