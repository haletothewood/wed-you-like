import { NextResponse } from 'next/server'
import { LoginAdmin } from '@/application/use-cases/LoginAdmin'
import { DrizzleAdminUserRepository } from '@/infrastructure/database/repositories/DrizzleAdminUserRepository'
import { DrizzleSessionRepository } from '@/infrastructure/database/repositories/DrizzleSessionRepository'

const adminUserRepository = new DrizzleAdminUserRepository()
const sessionRepository = new DrizzleSessionRepository()
const loginAdmin = new LoginAdmin(adminUserRepository, sessionRepository)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const result = await loginAdmin.execute({ username, password })

    const response = NextResponse.json({
      success: true,
      adminUserId: result.adminUserId,
    })

    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set('auth_token', result.sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof Error) {
      if (
        error.message === 'Invalid username or password' ||
        error.message === 'Account is deactivated'
      ) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
