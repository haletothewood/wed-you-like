import { eq, and } from 'drizzle-orm'
import { db } from '../connection'
import { guests } from '../schema'
import type { GuestRepository, GuestData } from '@/domain/repositories/GuestRepository'

export class DrizzleGuestRepository implements GuestRepository {
  async save(guest: GuestData): Promise<GuestData> {
    const now = new Date()

    await db
      .insert(guests)
      .values({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        inviteId: guest.inviteId,
        isPlusOne: guest.isPlusOne,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: guests.id,
        set: {
          name: guest.name,
          email: guest.email,
          isPlusOne: guest.isPlusOne,
          updatedAt: now,
        },
      })

    return guest
  }

  async findById(id: string): Promise<GuestData | null> {
    const record = await db.query.guests.findFirst({
      where: eq(guests.id, id),
    })

    if (!record) return null

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      inviteId: record.inviteId,
      isPlusOne: Boolean(record.isPlusOne),
    }
  }

  async findByInviteId(inviteId: string): Promise<GuestData[]> {
    const records = await db.query.guests.findMany({
      where: eq(guests.inviteId, inviteId),
    })

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      email: record.email,
      inviteId: record.inviteId,
      isPlusOne: Boolean(record.isPlusOne),
    }))
  }

  async findPlusOneByInviteId(inviteId: string): Promise<GuestData | null> {
    const record = await db.query.guests.findFirst({
      where: and(eq(guests.inviteId, inviteId), eq(guests.isPlusOne, true)),
    })

    if (!record) return null

    return {
      id: record.id,
      name: record.name,
      email: record.email,
      inviteId: record.inviteId,
      isPlusOne: true,
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(guests).where(eq(guests.id, id))
  }
}
