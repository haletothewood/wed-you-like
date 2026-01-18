import { nanoid } from 'nanoid'

export type CourseType = 'STARTER' | 'MAIN' | 'DESSERT'

export interface MealOptionProps {
  id: string
  courseType: CourseType
  name: string
  description: string | null
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export class MealOption {
  private constructor(private props: MealOptionProps) {}

  get id(): string {
    return this.props.id
  }

  get courseType(): CourseType {
    return this.props.courseType
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description
  }

  get isAvailable(): boolean {
    return this.props.isAvailable
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  static create(params: {
    courseType: CourseType
    name: string
    description?: string
  }): MealOption {
    MealOption.validateCourseType(params.courseType)
    MealOption.validateName(params.name)

    if (params.description) {
      MealOption.validateDescription(params.description)
    }

    const now = new Date()

    return new MealOption({
      id: nanoid(),
      courseType: params.courseType,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  update(params: { name?: string; description?: string }): void {
    if (params.name !== undefined) {
      MealOption.validateName(params.name)
      this.props.name = params.name.trim()
    }

    if (params.description !== undefined) {
      MealOption.validateDescription(params.description)
      this.props.description = params.description.trim() || null
    }

    this.props.updatedAt = new Date()
  }

  setAvailability(isAvailable: boolean): void {
    this.props.isAvailable = isAvailable
    this.props.updatedAt = new Date()
  }

  private static validateCourseType(courseType: CourseType): void {
    const validTypes: CourseType[] = ['STARTER', 'MAIN', 'DESSERT']
    if (!validTypes.includes(courseType)) {
      throw new Error('Invalid course type')
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Meal option name is required')
    }

    if (name.length > 200) {
      throw new Error('Meal option name must be 200 characters or less')
    }
  }

  private static validateDescription(description: string): void {
    if (description.length > 1000) {
      throw new Error('Description must be 1000 characters or less')
    }
  }
}
