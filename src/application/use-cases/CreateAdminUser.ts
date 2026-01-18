import { AdminUser } from '@/domain/entities/AdminUser'
import type { AdminUserRepository } from '@/domain/repositories/AdminUserRepository'
import { PasswordService } from '@/infrastructure/security/PasswordService'

export interface CreateAdminUserRequest {
  username: string
  email: string
  password: string
}

export interface CreateAdminUserResponse {
  id: string
  username: string
  email: string
}

export class CreateAdminUser {
  constructor(private adminUserRepository: AdminUserRepository) {}

  async execute(request: CreateAdminUserRequest): Promise<CreateAdminUserResponse> {
    const usernameExists = await this.adminUserRepository.existsByUsername(request.username)
    if (usernameExists) {
      throw new Error('Username already exists')
    }

    const emailExists = await this.adminUserRepository.existsByEmail(request.email)
    if (emailExists) {
      throw new Error('Email already exists')
    }

    const passwordHash = await PasswordService.hash(request.password)

    const adminUser = AdminUser.create({
      username: request.username,
      email: request.email,
      passwordHash,
    })

    await this.adminUserRepository.save(adminUser)

    return {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
    }
  }
}
