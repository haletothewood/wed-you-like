import { NextResponse } from 'next/server'
import { LoginAdmin } from '@/application/use-cases/LoginAdmin'
import { DrizzleAdminUserRepository } from '@/infrastructure/database/repositories/DrizzleAdminUserRepository'
import { DrizzleSessionRepository } from '@/infrastructure/database/repositories/DrizzleSessionRepository'
import { loginSchema } from '@/application/validation/schemas'
import { loginRateLimiter } from '@/infrastructure/security/RateLimiter'

const adminUserRepository = new DrizzleAdminUserRepository()
const sessionRepository = new DrizzleSessionRepository()
const loginAdmin = new LoginAdmin(adminUserRepository, sessionRepository)

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  const rateLimitResult = loginRateLimiter.check(clientIp)
  if (!rateLimitResult.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfterMs ?? 0) / 1000)
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  try {
    const body = await request.json()

    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { username, password } = validation.data

    const result = await loginAdmin.execute({ username, password })

    loginRateLimiter.reset(clientIp)

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
        loginRateLimiter.record(clientIp)
        return NextResponse.json(
          { error: error.message },
          {
            status: 401,
            headers: {
              'X-RateLimit-Remaining': String(rateLimitResult.remaining - 1),
            },
          }
        )
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
