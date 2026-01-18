import type { CustomQuestion } from '../entities/CustomQuestion'

export interface CustomQuestionRepository {
  save(question: CustomQuestion): Promise<void>
  findById(id: string): Promise<CustomQuestion | null>
  findAll(): Promise<CustomQuestion[]>
  findAllOrdered(): Promise<CustomQuestion[]>
  delete(id: string): Promise<void>
}
