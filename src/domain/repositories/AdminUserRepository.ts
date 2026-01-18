import { AdminUser } from '../entities/AdminUser'

export interface AdminUserRepository {
  save(adminUser: AdminUser): Promise<void>
  findById(id: string): Promise<AdminUser | null>
  findByUsername(username: string): Promise<AdminUser | null>
  findByEmail(email: string): Promise<AdminUser | null>
  existsByUsername(username: string): Promise<boolean>
  existsByEmail(email: string): Promise<boolean>
}
