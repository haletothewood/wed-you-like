import { eq } from 'drizzle-orm'
import { db } from '../connection'
import { questionResponses } from '../schema'
import {
  QuestionResponse,
  type QuestionResponseProps,
} from '@/domain/entities/QuestionResponse'
import type { QuestionResponseRepository } from '@/domain/repositories/QuestionResponseRepository'

export class DrizzleQuestionResponseRepository
  implements QuestionResponseRepository
{
  async save(response: QuestionResponse): Promise<void> {
    await db
      .insert(questionResponses)
      .values({
        id: response.id,
        rsvpId: response.rsvpId,
        questionId: response.questionId,
        responseText: response.responseText,
        createdAt: response.createdAt,
      })
      .onConflictDoUpdate({
        target: questionResponses.id,
        set: {
          responseText: response.responseText,
        },
      })
  }

  async saveMany(responses: QuestionResponse[]): Promise<void> {
    if (responses.length === 0) return

    await db.insert(questionResponses).values(
      responses.map((response) => ({
        id: response.id,
        rsvpId: response.rsvpId,
        questionId: response.questionId,
        responseText: response.responseText,
        createdAt: response.createdAt,
      }))
    )
  }

  async findByRSVPId(rsvpId: string): Promise<QuestionResponse[]> {
    const records = await db.query.questionResponses.findMany({
      where: eq(questionResponses.rsvpId, rsvpId),
    })

    return records.map((record) => this.toDomain(record))
  }

  async deleteByRSVPId(rsvpId: string): Promise<void> {
    await db
      .delete(questionResponses)
      .where(eq(questionResponses.rsvpId, rsvpId))
  }

  private toDomain(record: {
    id: string
    rsvpId: string
    questionId: string
    responseText: string
    createdAt: Date
  }): QuestionResponse {
    const props: QuestionResponseProps = {
      id: record.id,
      rsvpId: record.rsvpId,
      questionId: record.questionId,
      responseText: record.responseText,
      createdAt: record.createdAt,
    }

    return Object.create(QuestionResponse.prototype, {
      props: {
        value: props,
        writable: true,
        enumerable: false,
        configurable: false,
      },
    })
  }
}
