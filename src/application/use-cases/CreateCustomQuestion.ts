import {
  CustomQuestion,
  type QuestionType,
} from '@/domain/entities/CustomQuestion'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'

export interface CreateCustomQuestionRequest {
  questionText: string
  questionType: QuestionType
  options?: string[]
  isRequired: boolean
  displayOrder: number
}

export interface CreateCustomQuestionResponse {
  id: string
}

export class CreateCustomQuestion {
  constructor(private customQuestionRepository: CustomQuestionRepository) {}

  async execute(
    request: CreateCustomQuestionRequest
  ): Promise<CreateCustomQuestionResponse> {
    const question = CustomQuestion.create({
      questionText: request.questionText,
      questionType: request.questionType,
      options: request.options,
      isRequired: request.isRequired,
      displayOrder: request.displayOrder,
    })

    await this.customQuestionRepository.save(question)

    return { id: question.id }
  }
}
