import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'

export interface UpdateCustomQuestionRequest {
  id: string
  questionText?: string
  options?: string[]
  isRequired?: boolean
  displayOrder?: number
}

export interface UpdateCustomQuestionResponse {
  success: boolean
}

export class UpdateCustomQuestion {
  constructor(private customQuestionRepository: CustomQuestionRepository) {}

  async execute(
    request: UpdateCustomQuestionRequest
  ): Promise<UpdateCustomQuestionResponse> {
    const question = await this.customQuestionRepository.findById(request.id)

    if (!question) {
      throw new Error('Custom question not found')
    }

    question.update({
      questionText: request.questionText,
      options: request.options,
      isRequired: request.isRequired,
      displayOrder: request.displayOrder,
    })

    await this.customQuestionRepository.save(question)

    return { success: true }
  }
}
