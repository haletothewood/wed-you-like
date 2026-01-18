import type { AdminUserRepository } from '@/domain/repositories/AdminUserRepository'
import type { SessionRepository } from '@/domain/repositories/SessionRepository'
import { Session } from '@/domain/entities/Session'
import { PasswordService } from '@/infrastructure/security/PasswordService'

export interface LoginAdminRequest {
  username: string
  password: string
}

export interface LoginAdminResponse {
  sessionToken: string
  adminUserId: string
}

export class LoginAdmin {
  constructor(
    private adminUserRepository: AdminUserRepository,
    private sessionRepository: SessionRepository
  ) {}

  async execute(request: LoginAdminRequest): Promise<LoginAdminResponse> {
    const adminUser = await this.adminUserRepository.findByUsername(request.username)

    if (!adminUser) {
      throw new Error('Invalid username or password')
    }

    const passwordMatch = await PasswordService.compare(request.password, adminUser.passwordHash)

    if (!passwordMatch) {
      throw new Error('Invalid username or password')
    }

    if (!adminUser.isActive) {
      throw new Error('Account is deactivated')
    }

    const session = Session.create({
      adminUserId: adminUser.id,
      expiryHours: 24,
    })

    adminUser.markAsLoggedIn()

    await this.sessionRepository.save(session)
    await this.adminUserRepository.save(adminUser)

    return {
      sessionToken: session.token,
      adminUserId: adminUser.id,
    }
  }
}
