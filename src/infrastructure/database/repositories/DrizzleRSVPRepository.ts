import { eq, inArray } from 'drizzle-orm'
import type { RSVPRepository } from '@/domain/repositories/RSVPRepository'
import { RSVP } from '@/domain/entities/RSVP'
import { db } from '../connection'
import { rsvps } from '../schema'

export class DrizzleRSVPRepository implements RSVPRepository {
  async save(rsvp: RSVP): Promise<void> {
    await db
      .insert(rsvps)
      .values({
        id: rsvp.id,
        inviteId: rsvp.inviteId,
        isAttending: rsvp.isAttending,
        adultsAttending: rsvp.adultsAttending,
        childrenAttending: rsvp.childrenAttending,
        dietaryRequirements: rsvp.dietaryRequirements,
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
          updatedAt: rsvp.updatedAt,
        },
      })
  }

  async findByInviteId(inviteId: string): Promise<RSVP | null> {
    const record = await db.query.rsvps.findFirst({
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

    const records = await db.query.rsvps.findMany({
      where: inArray(rsvps.inviteId, inviteIds),
    })

    const result = new Map<string, RSVP>()
    for (const record of records) {
      result.set(record.inviteId, this.toDomain(record))
    }

    return result
  }

  async findById(id: string): Promise<RSVP | null> {
    const record = await db.query.rsvps.findFirst({
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
    respondedAt: Date
    createdAt: Date
    updatedAt: Date
  }): RSVP {
    const rsvp = Object.create(RSVP.prototype)
    rsvp.props = {
      id: record.id,
      inviteId: record.inviteId,
      isAttending: Boolean(record.isAttending),
      adultsAttending: record.adultsAttending,
      childrenAttending: record.childrenAttending,
      dietaryRequirements: record.dietaryRequirements,
      respondedAt: record.respondedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return rsvp
  }
}
