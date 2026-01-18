import { NextResponse } from 'next/server'
import { DrizzleMealOptionRepository } from '@/infrastructure/database/repositories/DrizzleMealOptionRepository'
import { CreateMealOption } from '@/application/use-cases/CreateMealOption'
import { GetAllMealOptions } from '@/application/use-cases/GetAllMealOptions'

const mealOptionRepository = new DrizzleMealOptionRepository()

export async function GET() {
  try {
    const getAllMealOptions = new GetAllMealOptions(mealOptionRepository)
    const mealOptions = await getAllMealOptions.execute()

    return NextResponse.json({ mealOptions })
  } catch (error) {
    console.error('Error fetching meal options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal options' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const createMealOption = new CreateMealOption(mealOptionRepository)
    const result = await createMealOption.execute({
      courseType: body.courseType,
      name: body.name,
      description: body.description,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating meal option:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create meal option'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
