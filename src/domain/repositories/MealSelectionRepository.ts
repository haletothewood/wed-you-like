import type { MealSelection } from '../entities/MealSelection'

export interface MealSelectionRepository {
  save(mealSelection: MealSelection): Promise<void>
  saveMany(mealSelections: MealSelection[]): Promise<void>
  findByGuestId(guestId: string): Promise<MealSelection[]>
  deleteByGuestId(guestId: string): Promise<void>
}
