import type { InviteRepository } from '@/domain/repositories/InviteRepository'

export class DeleteInvite {
  constructor(private inviteRepository: InviteRepository) {}

  async execute(inviteId: string): Promise<void> {
    const invite = await this.inviteRepository.findById(inviteId)

    if (!invite) {
      throw new Error('Invite not found')
    }

    await this.inviteRepository.delete(inviteId)
  }
}
