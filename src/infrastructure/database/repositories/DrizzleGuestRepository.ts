import { eq, and } from 'drizzle-orm'
import { db } from '../connection'
import { guests } from '../schema'
import type { GuestRepository, GuestData } from '@/domain/repositories/GuestRepository'

type GuestDatabase = Pick<typeof db, 'insert' | 'delete' | 'query'>

export class DrizzleGuestRepository implements GuestRepository {
  constructor(private database: GuestDatabase = db) {}

  async save(guest: GuestData): Promise<GuestData> {
    const now = new Date()

    await this.database
      .insert(guests)
      .values({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        inviteId: guest.inviteId,
        isPlusOne: guest.isPlusOne,
        isChild: guest.isChild,
        parentGuestId: guest.parentGuestId,
        isInviteLead: guest.isInviteLead,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: guests.id,
        set: {
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          isPlusOne: guest.isPlusOne,
          isChild: guest.isChild,
          parentGuestId: guest.parentGuestId,
          isInviteLead: guest.isInviteLead,
          updatedAt: now,
        },
      })

    return guest
  }

  async findById(id: string): Promise<GuestData | null> {
    const record = await this.database.query.guests.findFirst({
      where: eq(guests.id, id),
    })

    if (!record) return null

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone || '',
      inviteId: record.inviteId,
      isPlusOne: Boolean(record.isPlusOne),
      isChild: Boolean(record.isChild),
      parentGuestId: record.parentGuestId || undefined,
      isInviteLead: Boolean(record.isInviteLead),
    }
  }

  async findByInviteId(inviteId: string): Promise<GuestData[]> {
    const records = await this.database.query.guests.findMany({
      where: eq(guests.inviteId, inviteId),
    })

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone || '',
      inviteId: record.inviteId,
      isPlusOne: Boolean(record.isPlusOne),
      isChild: Boolean(record.isChild),
      parentGuestId: record.parentGuestId || undefined,
      isInviteLead: Boolean(record.isInviteLead),
    }))
  }

  async findPlusOneByInviteId(inviteId: string): Promise<GuestData | null> {
    const record = await this.database.query.guests.findFirst({
      where: and(eq(guests.inviteId, inviteId), eq(guests.isPlusOne, true)),
    })

    if (!record) return null

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone || '',
      inviteId: record.inviteId,
      isPlusOne: true,
      isChild: Boolean(record.isChild),
      parentGuestId: record.parentGuestId || undefined,
      isInviteLead: Boolean(record.isInviteLead),
    }
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(guests).where(eq(guests.id, id))
  }
}
