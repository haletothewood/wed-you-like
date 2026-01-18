import type { MealOption, CourseType } from '../entities/MealOption'

export interface MealOptionRepository {
  save(mealOption: MealOption): Promise<void>
  findById(id: string): Promise<MealOption | null>
  findByCourseType(courseType: CourseType): Promise<MealOption[]>
  findAll(): Promise<MealOption[]>
  delete(id: string): Promise<void>
}
