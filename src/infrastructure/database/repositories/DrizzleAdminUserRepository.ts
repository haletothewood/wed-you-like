import { eq } from 'drizzle-orm'
import type { AdminUserRepository } from '@/domain/repositories/AdminUserRepository'
import { AdminUser } from '@/domain/entities/AdminUser'
import { db } from '../connection'
import { adminUsers } from '../schema'

export class DrizzleAdminUserRepository implements AdminUserRepository {
  async save(adminUser: AdminUser): Promise<void> {
    await db
      .insert(adminUsers)
      .values({
        id: adminUser.id,
        username: adminUser.username.toLowerCase(),
        passwordHash: adminUser.passwordHash,
        email: adminUser.email.toLowerCase(),
        isActive: adminUser.isActive,
        lastLoginAt: adminUser.lastLoginAt,
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt,
      })
      .onConflictDoUpdate({
        target: adminUsers.id,
        set: {
          username: adminUser.username.toLowerCase(),
          passwordHash: adminUser.passwordHash,
          email: adminUser.email.toLowerCase(),
          isActive: adminUser.isActive,
          lastLoginAt: adminUser.lastLoginAt,
          updatedAt: adminUser.updatedAt,
        },
      })
  }

  async findById(id: string): Promise<AdminUser | null> {
    const adminUserRecord = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
    })

    if (!adminUserRecord) {
      return null
    }

    return this.toDomain(adminUserRecord)
  }

  async findByUsername(username: string): Promise<AdminUser | null> {
    const adminUserRecord = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.username, username.toLowerCase()),
    })

    if (!adminUserRecord) {
      return null
    }

    return this.toDomain(adminUserRecord)
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const adminUserRecord = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email.toLowerCase()),
    })

    if (!adminUserRecord) {
      return null
    }

    return this.toDomain(adminUserRecord)
  }

  async existsByUsername(username: string): Promise<boolean> {
    const result = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.username, username.toLowerCase()),
      columns: { id: true },
    })

    return result !== undefined
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email.toLowerCase()),
      columns: { id: true },
    })

    return result !== undefined
  }

  private toDomain(record: {
    id: string
    username: string
    passwordHash: string
    email: string
    isActive: boolean
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): AdminUser {
    const adminUser = Object.create(AdminUser.prototype)
    adminUser.props = {
      id: record.id,
      username: record.username,
      passwordHash: record.passwordHash,
      email: record.email,
      isActive: Boolean(record.isActive),
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return adminUser
  }
}
