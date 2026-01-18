import { eq, asc } from 'drizzle-orm'
import { db } from '../connection'
import { customQuestions } from '../schema'
import {
  CustomQuestion,
  type CustomQuestionProps,
  type QuestionType,
} from '@/domain/entities/CustomQuestion'
import type { CustomQuestionRepository } from '@/domain/repositories/CustomQuestionRepository'

export class DrizzleCustomQuestionRepository
  implements CustomQuestionRepository
{
  async save(question: CustomQuestion): Promise<void> {
    const optionsJson = JSON.stringify(question.options)

    await db
      .insert(customQuestions)
      .values({
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: optionsJson,
        isRequired: question.isRequired,
        displayOrder: question.displayOrder,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      })
      .onConflictDoUpdate({
        target: customQuestions.id,
        set: {
          questionText: question.questionText,
          options: optionsJson,
          isRequired: question.isRequired,
          displayOrder: question.displayOrder,
          updatedAt: question.updatedAt,
        },
      })
  }

  async findById(id: string): Promise<CustomQuestion | null> {
    const record = await db.query.customQuestions.findFirst({
      where: eq(customQuestions.id, id),
    })

    return record ? this.toDomain(record) : null
  }

  async findAll(): Promise<CustomQuestion[]> {
    const records = await db.query.customQuestions.findMany()
    return records.map((record) => this.toDomain(record))
  }

  async findAllOrdered(): Promise<CustomQuestion[]> {
    const records = await db.query.customQuestions.findMany({
      orderBy: asc(customQuestions.displayOrder),
    })
    return records.map((record) => this.toDomain(record))
  }

  async delete(id: string): Promise<void> {
    await db.delete(customQuestions).where(eq(customQuestions.id, id))
  }

  private toDomain(record: {
    id: string
    questionText: string
    questionType: string
    options: string | null
    isRequired: boolean
    displayOrder: number
    createdAt: Date
    updatedAt: Date
  }): CustomQuestion {
    const options = record.options ? JSON.parse(record.options) : []

    const props: CustomQuestionProps = {
      id: record.id,
      questionText: record.questionText,
      questionType: record.questionType as QuestionType,
      options,
      isRequired: record.isRequired,
      displayOrder: record.displayOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return Object.create(CustomQuestion.prototype, {
      props: {
        value: props,
        writable: true,
        enumerable: false,
        configurable: false,
      },
    })
  }
}
