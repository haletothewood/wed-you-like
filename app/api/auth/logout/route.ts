import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { LogoutAdmin } from '@/application/use-cases/LogoutAdmin'
import { DrizzleSessionRepository } from '@/infrastructure/database/repositories/DrizzleSessionRepository'

const sessionRepository = new DrizzleSessionRepository()
const logoutAdmin = new LogoutAdmin(sessionRepository)

export async function POST() {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')?.value

    if (authToken) {
      await logoutAdmin.execute({ sessionToken: authToken })
    }

    const response = NextResponse.json({ success: true })

    response.cookies.delete('auth_token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
