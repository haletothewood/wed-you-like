import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'

export interface DeleteMealOptionRequest {
  id: string
}

export interface DeleteMealOptionResponse {
  success: boolean
}

export class DeleteMealOption {
  constructor(private mealOptionRepository: MealOptionRepository) {}

  async execute(
    request: DeleteMealOptionRequest
  ): Promise<DeleteMealOptionResponse> {
    const mealOption = await this.mealOptionRepository.findById(request.id)

    if (!mealOption) {
      throw new Error('Meal option not found')
    }

    await this.mealOptionRepository.delete(request.id)

    return { success: true }
  }
}
