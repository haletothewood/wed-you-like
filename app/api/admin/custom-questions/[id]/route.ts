import { NextResponse } from 'next/server'
import { DrizzleCustomQuestionRepository } from '@/infrastructure/database/repositories/DrizzleCustomQuestionRepository'
import { UpdateCustomQuestion } from '@/application/use-cases/UpdateCustomQuestion'
import { DeleteCustomQuestion } from '@/application/use-cases/DeleteCustomQuestion'

const customQuestionRepository = new DrizzleCustomQuestionRepository()

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateCustomQuestion = new UpdateCustomQuestion(
      customQuestionRepository
    )
    const result = await updateCustomQuestion.execute({
      id,
      questionText: body.questionText,
      options: body.options,
      isRequired: body.isRequired,
      displayOrder: body.displayOrder,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating custom question:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update custom question'
    const status = message === 'Custom question not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const deleteCustomQuestion = new DeleteCustomQuestion(
      customQuestionRepository
    )
    const result = await deleteCustomQuestion.execute({ id })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting custom question:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to delete custom question'
    const status = message === 'Custom question not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
