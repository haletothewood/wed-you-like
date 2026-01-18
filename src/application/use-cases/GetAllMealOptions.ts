import type { CourseType } from '@/domain/entities/MealOption'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'

export interface MealOptionDTO {
  id: string
  courseType: CourseType
  name: string
  description: string | null
  isAvailable: boolean
}

export class GetAllMealOptions {
  constructor(private mealOptionRepository: MealOptionRepository) {}

  async execute(): Promise<MealOptionDTO[]> {
    const mealOptions = await this.mealOptionRepository.findAll()

    return mealOptions.map((option) => ({
      id: option.id,
      courseType: option.courseType,
      name: option.name,
      description: option.description,
      isAvailable: option.isAvailable,
    }))
  }
}
