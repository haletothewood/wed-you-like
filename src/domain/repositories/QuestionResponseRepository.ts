import type { QuestionResponse } from '../entities/QuestionResponse'

export interface QuestionResponseRepository {
  save(response: QuestionResponse): Promise<void>
  saveMany(responses: QuestionResponse[]): Promise<void>
  findByRSVPId(rsvpId: string): Promise<QuestionResponse[]>
  deleteByRSVPId(rsvpId: string): Promise<void>
}
