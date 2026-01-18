import { eq } from 'drizzle-orm'
import { db } from '../connection'
import { mealSelections } from '../schema'
import {
  MealSelection,
  type MealSelectionProps,
} from '@/domain/entities/MealSelection'
import type { MealSelectionRepository } from '@/domain/repositories/MealSelectionRepository'
import type { CourseType } from '@/domain/entities/MealOption'

export class DrizzleMealSelectionRepository
  implements MealSelectionRepository
{
  async save(mealSelection: MealSelection): Promise<void> {
    await db
      .insert(mealSelections)
      .values({
        id: mealSelection.id,
        guestId: mealSelection.guestId,
        mealOptionId: mealSelection.mealOptionId,
        courseType: mealSelection.courseType,
        createdAt: mealSelection.createdAt,
      })
      .onConflictDoUpdate({
        target: mealSelections.id,
        set: {
          mealOptionId: mealSelection.mealOptionId,
        },
      })
  }

  async saveMany(selections: MealSelection[]): Promise<void> {
    if (selections.length === 0) return

    await db.insert(mealSelections).values(
      selections.map((selection) => ({
        id: selection.id,
        guestId: selection.guestId,
        mealOptionId: selection.mealOptionId,
        courseType: selection.courseType,
        createdAt: selection.createdAt,
      }))
    )
  }

  async findByGuestId(guestId: string): Promise<MealSelection[]> {
    const records = await db.query.mealSelections.findMany({
      where: eq(mealSelections.guestId, guestId),
    })

    return records.map((record) => this.toDomain(record))
  }

  async deleteByGuestId(guestId: string): Promise<void> {
    await db.delete(mealSelections).where(eq(mealSelections.guestId, guestId))
  }

  private toDomain(record: {
    id: string
    guestId: string
    mealOptionId: string
    courseType: string
    createdAt: Date
  }): MealSelection {
    const props: MealSelectionProps = {
      id: record.id,
      guestId: record.guestId,
      mealOptionId: record.mealOptionId,
      courseType: record.courseType as CourseType,
      createdAt: record.createdAt,
    }

    return Object.create(MealSelection.prototype, {
      props: {
        value: props,
        writable: true,
        enumerable: false,
        configurable: false,
      },
    })
  }
}
