import type { SessionRepository } from '@/domain/repositories/SessionRepository'

export interface LogoutAdminRequest {
  sessionToken: string
}

export interface LogoutAdminResponse {
  success: boolean
}

export class LogoutAdmin {
  constructor(private sessionRepository: SessionRepository) {}

  async execute(request: LogoutAdminRequest): Promise<LogoutAdminResponse> {
    await this.sessionRepository.deleteByToken(request.sessionToken)

    return {
      success: true,
    }
  }
}
