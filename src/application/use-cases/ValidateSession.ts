import type { SessionRepository } from '@/domain/repositories/SessionRepository'
import type { AdminUserRepository } from '@/domain/repositories/AdminUserRepository'

export interface ValidateSessionRequest {
  sessionToken: string
}

export interface ValidateSessionResponse {
  isValid: boolean
  adminUserId?: string
}

export class ValidateSession {
  constructor(
    private sessionRepository: SessionRepository,
    private adminUserRepository: AdminUserRepository
  ) {}

  async execute(request: ValidateSessionRequest): Promise<ValidateSessionResponse> {
    const session = await this.sessionRepository.findByToken(request.sessionToken)

    if (!session) {
      return { isValid: false }
    }

    if (session.isExpired()) {
      await this.sessionRepository.delete(session.id)
      return { isValid: false }
    }

    const adminUser = await this.adminUserRepository.findById(session.adminUserId)

    if (!adminUser || !adminUser.isActive) {
      await this.sessionRepository.delete(session.id)
      return { isValid: false }
    }

    return {
      isValid: true,
      adminUserId: adminUser.id,
    }
  }
}
