import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'

export interface UpdateMealOptionRequest {
  id: string
  name?: string
  description?: string
  isAvailable?: boolean
}

export interface UpdateMealOptionResponse {
  success: boolean
}

export class UpdateMealOption {
  constructor(private mealOptionRepository: MealOptionRepository) {}

  async execute(
    request: UpdateMealOptionRequest
  ): Promise<UpdateMealOptionResponse> {
    const mealOption = await this.mealOptionRepository.findById(request.id)

    if (!mealOption) {
      throw new Error('Meal option not found')
    }

    if (request.name !== undefined || request.description !== undefined) {
      mealOption.update({
        name: request.name,
        description: request.description,
      })
    }

    if (request.isAvailable !== undefined) {
      mealOption.setAvailability(request.isAvailable)
    }

    await this.mealOptionRepository.save(mealOption)

    return { success: true }
  }
}
