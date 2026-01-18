import { eq, lt } from 'drizzle-orm'
import type { SessionRepository } from '@/domain/repositories/SessionRepository'
import { Session } from '@/domain/entities/Session'
import { db } from '../connection'
import { sessions } from '../schema'

export class DrizzleSessionRepository implements SessionRepository {
  async save(session: Session): Promise<void> {
    await db
      .insert(sessions)
      .values({
        id: session.id,
        adminUserId: session.adminUserId,
        token: session.token,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          adminUserId: session.adminUserId,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      })
  }

  async findByToken(token: string): Promise<Session | null> {
    const sessionRecord = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    })

    if (!sessionRecord) {
      return null
    }

    return this.toDomain(sessionRecord)
  }

  async findByAdminUserId(adminUserId: string): Promise<Session[]> {
    const sessionRecords = await db.query.sessions.findMany({
      where: eq(sessions.adminUserId, adminUserId),
    })

    return sessionRecords.map((record) => this.toDomain(record))
  }

  async delete(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id))
  }

  async deleteByToken(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token))
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))
  }

  async deleteByAdminUserId(adminUserId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.adminUserId, adminUserId))
  }

  private toDomain(record: {
    id: string
    adminUserId: string
    token: string
    expiresAt: Date
    createdAt: Date
  }): Session {
    return Session.reconstitute({
      id: record.id,
      adminUserId: record.adminUserId,
      token: record.token,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    })
  }
}
