import { nanoid } from 'nanoid'

export type QuestionType = 'TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'

export interface CustomQuestionProps {
  id: string
  questionText: string
  questionType: QuestionType
  options: string[]
  isRequired: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export class CustomQuestion {
  private constructor(private props: CustomQuestionProps) {}

  get id(): string {
    return this.props.id
  }

  get questionText(): string {
    return this.props.questionText
  }

  get questionType(): QuestionType {
    return this.props.questionType
  }

  get options(): string[] {
    return [...this.props.options]
  }

  get isRequired(): boolean {
    return this.props.isRequired
  }

  get displayOrder(): number {
    return this.props.displayOrder
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(params: {
    questionText: string
    questionType: QuestionType
    options?: string[]
    isRequired: boolean
    displayOrder: number
  }): CustomQuestion {
    CustomQuestion.validateQuestionType(params.questionType)
    CustomQuestion.validateQuestionText(params.questionText)
    CustomQuestion.validateDisplayOrder(params.displayOrder)

    const options = params.options || []

    if (
      params.questionType === 'SINGLE_CHOICE' ||
      params.questionType === 'MULTIPLE_CHOICE'
    ) {
      CustomQuestion.validateOptions(params.questionType, options)
    }

    const now = new Date()

    return new CustomQuestion({
      id: nanoid(),
      questionText: params.questionText.trim(),
      questionType: params.questionType,
      options,
      isRequired: params.isRequired,
      displayOrder: params.displayOrder,
      createdAt: now,
      updatedAt: now,
    })
  }

  update(params: {
    questionText?: string
    options?: string[]
    isRequired?: boolean
    displayOrder?: number
  }): void {
    if (params.questionText !== undefined) {
      CustomQuestion.validateQuestionText(params.questionText)
      this.props.questionText = params.questionText.trim()
    }

    if (params.options !== undefined) {
      if (
        this.props.questionType === 'SINGLE_CHOICE' ||
        this.props.questionType === 'MULTIPLE_CHOICE'
      ) {
        CustomQuestion.validateOptions(this.props.questionType, params.options)
      }
      this.props.options = params.options
    }

    if (params.isRequired !== undefined) {
      this.props.isRequired = params.isRequired
    }

    if (params.displayOrder !== undefined) {
      CustomQuestion.validateDisplayOrder(params.displayOrder)
      this.props.displayOrder = params.displayOrder
    }

    this.props.updatedAt = new Date()
  }

  private static validateQuestionType(questionType: QuestionType): void {
    const validTypes: QuestionType[] = [
      'TEXT',
      'SINGLE_CHOICE',
      'MULTIPLE_CHOICE',
    ]
    if (!validTypes.includes(questionType)) {
      throw new Error('Invalid question type')
    }
  }

  private static validateQuestionText(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new Error('Question text is required')
    }

    if (text.length > 500) {
      throw new Error('Question text must be 500 characters or less')
    }
  }

  private static validateOptions(
    questionType: QuestionType,
    options: string[]
  ): void {
    if (options.length < 2) {
      if (questionType === 'SINGLE_CHOICE') {
        throw new Error('Single choice questions must have at least 2 options')
      } else if (questionType === 'MULTIPLE_CHOICE') {
        throw new Error(
          'Multiple choice questions must have at least 2 options'
        )
      }
    }
  }

  private static validateDisplayOrder(order: number): void {
    if (order < 0) {
      throw new Error('Display order must be a positive number')
    }
  }
}
