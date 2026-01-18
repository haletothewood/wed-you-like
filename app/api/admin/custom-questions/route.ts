import { NextResponse } from 'next/server'
import { DrizzleCustomQuestionRepository } from '@/infrastructure/database/repositories/DrizzleCustomQuestionRepository'
import { CreateCustomQuestion } from '@/application/use-cases/CreateCustomQuestion'
import { GetAllCustomQuestions } from '@/application/use-cases/GetAllCustomQuestions'

const customQuestionRepository = new DrizzleCustomQuestionRepository()

export async function GET() {
  try {
    const getAllCustomQuestions = new GetAllCustomQuestions(
      customQuestionRepository
    )
    const questions = await getAllCustomQuestions.execute()

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error fetching custom questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom questions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const createCustomQuestion = new CreateCustomQuestion(
      customQuestionRepository
    )
    const result = await createCustomQuestion.execute({
      questionText: body.questionText,
      questionType: body.questionType,
      options: body.options,
      isRequired: body.isRequired,
      displayOrder: body.displayOrder,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating custom question:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to create custom question'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
