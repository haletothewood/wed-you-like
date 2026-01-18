import { Session } from '../entities/Session'

export interface SessionRepository {
  save(session: Session): Promise<void>
  findByToken(token: string): Promise<Session | null>
  findByAdminUserId(adminUserId: string): Promise<Session[]>
  delete(id: string): Promise<void>
  deleteByToken(token: string): Promise<void>
  deleteExpiredSessions(): Promise<void>
  deleteByAdminUserId(adminUserId: string): Promise<void>
}
