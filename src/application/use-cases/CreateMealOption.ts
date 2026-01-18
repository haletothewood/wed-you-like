import { MealOption, type CourseType } from '@/domain/entities/MealOption'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'

export interface CreateMealOptionRequest {
  courseType: CourseType
  name: string
  description?: string
}

export interface CreateMealOptionResponse {
  id: string
}

export class CreateMealOption {
  constructor(private mealOptionRepository: MealOptionRepository) {}

  async execute(
    request: CreateMealOptionRequest
  ): Promise<CreateMealOptionResponse> {
    const mealOption = MealOption.create({
      courseType: request.courseType,
      name: request.name,
      description: request.description,
    })

    await this.mealOptionRepository.save(mealOption)

    return { id: mealOption.id }
  }
}
