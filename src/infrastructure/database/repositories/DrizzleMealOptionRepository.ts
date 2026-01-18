import { eq } from 'drizzle-orm'
import { db } from '../connection'
import { mealOptions } from '../schema'
import {
  MealOption,
  type MealOptionProps,
  type CourseType,
} from '@/domain/entities/MealOption'
import type { MealOptionRepository } from '@/domain/repositories/MealOptionRepository'

export class DrizzleMealOptionRepository implements MealOptionRepository {
  async save(mealOption: MealOption): Promise<void> {
    await db
      .insert(mealOptions)
      .values({
        id: mealOption.id,
        courseType: mealOption.courseType,
        name: mealOption.name,
        description: mealOption.description,
        isAvailable: mealOption.isAvailable,
        createdAt: mealOption.createdAt,
        updatedAt: mealOption.updatedAt,
      })
      .onConflictDoUpdate({
        target: mealOptions.id,
        set: {
          name: mealOption.name,
          description: mealOption.description,
          isAvailable: mealOption.isAvailable,
          updatedAt: mealOption.updatedAt,
        },
      })
  }

  async findById(id: string): Promise<MealOption | null> {
    const record = await db.query.mealOptions.findFirst({
      where: eq(mealOptions.id, id),
    })

    return record ? this.toDomain(record) : null
  }

  async findByCourseType(courseType: CourseType): Promise<MealOption[]> {
    const records = await db.query.mealOptions.findMany({
      where: eq(mealOptions.courseType, courseType),
    })

    return records.map((record) => this.toDomain(record))
  }

  async findAll(): Promise<MealOption[]> {
    const records = await db.query.mealOptions.findMany()
    return records.map((record) => this.toDomain(record))
  }

  async delete(id: string): Promise<void> {
    await db.delete(mealOptions).where(eq(mealOptions.id, id))
  }

  private toDomain(record: {
    id: string
    courseType: string
    name: string
    description: string | null
    isAvailable: boolean
    createdAt: Date
    updatedAt: Date
  }): MealOption {
    const props: MealOptionProps = {
      id: record.id,
      courseType: record.courseType as CourseType,
      name: record.name,
      description: record.description,
      isAvailable: record.isAvailable,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    return Object.create(MealOption.prototype, {
      props: {
        value: props,
        writable: true,
        enumerable: false,
        configurable: false,
      },
    })
  }
}
