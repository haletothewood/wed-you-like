import { nanoid } from 'nanoid'
import type { CourseType } from './MealOption'

export interface MealSelectionProps {
  id: string
  guestId: string
  mealOptionId: string
  courseType: CourseType
  createdAt: Date
}

export class MealSelection {
  private constructor(private props: MealSelectionProps) {}

  get id(): string {
    return this.props.id
  }

  get guestId(): string {
    return this.props.guestId
  }

  get mealOptionId(): string {
    return this.props.mealOptionId
  }

  get courseType(): CourseType {
    return this.props.courseType
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  static create(params: {
    guestId: string
    mealOptionId: string
    courseType: CourseType
  }): MealSelection {
    return new MealSelection({
      id: nanoid(),
      guestId: params.guestId,
      mealOptionId: params.mealOptionId,
      courseType: params.courseType,
      createdAt: new Date(),
    })
  }
}
