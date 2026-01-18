import { Invite } from '../entities/Invite'

export interface InviteRepository {
  save(invite: Invite): Promise<void>
  findById(id: string): Promise<Invite | null>
  findByToken(token: string): Promise<Invite | null>
  findAll(): Promise<Invite[]>
  delete(id: string): Promise<void>
  existsByToken(token: string): Promise<boolean>
}
