import type { QuestionType } from '@/domain/entities/CustomQuestion'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'

export interface CustomQuestionDTO {
  id: string
  questionText: string
  questionType: QuestionType
  options: string[]
  isRequired: boolean
  displayOrder: number
}

export class GetAllCustomQuestions {
  constructor(private customQuestionRepository: CustomQuestionRepository) {}

  async execute(): Promise<CustomQuestionDTO[]> {
    const questions = await this.customQuestionRepository.findAllOrdered()

    return questions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options,
      isRequired: question.isRequired,
      displayOrder: question.displayOrder,
    }))
  }
}
