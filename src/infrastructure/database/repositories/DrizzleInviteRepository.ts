import { eq } from 'drizzle-orm'
import type { InviteRepository } from '@/domain/repositories/InviteRepository'
import { Invite, type Guest } from '@/domain/entities/Invite'
import { db } from '../connection'
import { invites, guests } from '../schema'

export class DrizzleInviteRepository implements InviteRepository {
  async save(invite: Invite): Promise<void> {
    // Insert or update invite
    await db
      .insert(invites)
      .values({
        id: invite.id,
        token: invite.token,
        groupName: invite.groupName,
        adultsCount: invite.adultsCount,
        childrenCount: invite.childrenCount,
        plusOneAllowed: invite.plusOneAllowed,
        sentAt: invite.sentAt,
        createdAt: invite.createdAt,
        updatedAt: invite.updatedAt,
      })
      .onConflictDoUpdate({
        target: invites.id,
        set: {
          groupName: invite.groupName,
          adultsCount: invite.adultsCount,
          childrenCount: invite.childrenCount,
          plusOneAllowed: invite.plusOneAllowed,
          sentAt: invite.sentAt,
          updatedAt: invite.updatedAt,
        },
      })

    // Delete existing guests for this invite
    await db.delete(guests).where(eq(guests.inviteId, invite.id))

    // Insert guests
    if (invite.guests.length > 0) {
      const now = new Date()
      await db.insert(guests).values(
        invite.guests.map((guest) => ({
          id: guest.id,
          name: guest.name,
          email: guest.email,
          inviteId: invite.id,
          createdAt: now,
          updatedAt: now,
        }))
      )
    }
  }

  async findById(id: string): Promise<Invite | null> {
    const inviteRecord = await db.query.invites.findFirst({
      where: eq(invites.id, id),
      with: {
        guests: true,
      },
    })

    if (!inviteRecord) {
      return null
    }

    return this.toDomain(inviteRecord)
  }

  async findByToken(token: string): Promise<Invite | null> {
    const inviteRecord = await db.query.invites.findFirst({
      where: eq(invites.token, token),
      with: {
        guests: true,
      },
    })

    if (!inviteRecord) {
      return null
    }

    return this.toDomain(inviteRecord)
  }

  async findAll(): Promise<Invite[]> {
    const inviteRecords = await db.query.invites.findMany({
      with: {
        guests: true,
      },
    })

    return inviteRecords.map((record) => this.toDomain(record))
  }

  async delete(id: string): Promise<void> {
    await db.delete(invites).where(eq(invites.id, id))
  }

  async existsByToken(token: string): Promise<boolean> {
    const result = await db.query.invites.findFirst({
      where: eq(invites.token, token),
      columns: { id: true },
    })

    return result !== undefined
  }

  private toDomain(record: {
    id: string
    token: string
    groupName: string | null
    adultsCount: number
    childrenCount: number
    plusOneAllowed: boolean
    sentAt: Date | null
    createdAt: Date
    updatedAt: Date
    guests?: Array<{ id: string; name: string; email: string }>
  }): Invite {
    const guestsList: Guest[] =
      record.guests?.map((g) => ({
        id: g.id,
        name: g.name,
        email: g.email,
      })) || []

    // We need to reconstruct the Invite through reflection since constructor is private
    // This is a common pattern in DDD with ORMs
    const invite = Object.create(Invite.prototype)
    invite.props = {
      id: record.id,
      token: record.token,
      groupName: record.groupName,
      adultsCount: record.adultsCount,
      childrenCount: record.childrenCount,
      plusOneAllowed: Boolean(record.plusOneAllowed),
      guests: guestsList,
      sentAt: record.sentAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return invite
  }
}
