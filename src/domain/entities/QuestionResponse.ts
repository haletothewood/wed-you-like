import { nanoid } from 'nanoid'

export interface QuestionResponseProps {
  id: string
  rsvpId: string
  questionId: string
  responseText: string
  createdAt: Date
}

export class QuestionResponse {
  private constructor(private props: QuestionResponseProps) {}

  get id(): string {
    return this.props.id
  }

  get rsvpId(): string {
    return this.props.rsvpId
  }

  get questionId(): string {
    return this.props.questionId
  }

  get responseText(): string {
    return this.props.responseText
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  static create(params: {
    rsvpId: string
    questionId: string
    responseText: string
  }): QuestionResponse {
    return new QuestionResponse({
      id: nanoid(),
      rsvpId: params.rsvpId,
      questionId: params.questionId,
      responseText: params.responseText,
      createdAt: new Date(),
    })
  }
}
