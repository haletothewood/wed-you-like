import { NextResponse } from 'next/server'
import { DrizzleMealOptionRepository } from '@/infrastructure/database/repositories/DrizzleMealOptionRepository'
import { UpdateMealOption } from '@/application/use-cases/UpdateMealOption'
import { DeleteMealOption } from '@/application/use-cases/DeleteMealOption'

const mealOptionRepository = new DrizzleMealOptionRepository()

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateMealOption = new UpdateMealOption(mealOptionRepository)
    const result = await updateMealOption.execute({
      id,
      name: body.name,
      description: body.description,
      isAvailable: body.isAvailable,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating meal option:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to update meal option'
    const status = message === 'Meal option not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const deleteMealOption = new DeleteMealOption(mealOptionRepository)
    const result = await deleteMealOption.execute({ id })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting meal option:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to delete meal option'
    const status = message === 'Meal option not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
