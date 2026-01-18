import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'

export interface DeleteCustomQuestionRequest {
  id: string
}

export interface DeleteCustomQuestionResponse {
  success: boolean
}

export class DeleteCustomQuestion {
  constructor(private customQuestionRepository: CustomQuestionRepository) {}

  async execute(
    request: DeleteCustomQuestionRequest
  ): Promise<DeleteCustomQuestionResponse> {
    const question = await this.customQuestionRepository.findById(request.id)

    if (!question) {
      throw new Error('Custom question not found')
    }

    await this.customQuestionRepository.delete(request.id)

    return { success: true }
  }
}
