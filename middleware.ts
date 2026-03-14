import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ValidateSession } from '@/application/use-cases/ValidateSession'
import { DrizzleSessionRepository } from '@/infrastructure/database/repositories/DrizzleSessionRepository'
import { DrizzleAdminUserRepository } from '@/infrastructure/database/repositories/DrizzleAdminUserRepository'

export const runtime = 'nodejs'

const sessionRepository = new DrizzleSessionRepository()
const adminUserRepository = new DrizzleAdminUserRepository()
const validateSession = new ValidateSession(sessionRepository, adminUserRepository)
const robotsTag = 'noindex, nofollow, noarchive, nosnippet, noimageindex'

function withRobotsHeader(response: NextResponse) {
  response.headers.set('X-Robots-Tag', robotsTag)
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminApiRoute = pathname.startsWith('/api/admin')
  const isLoginRoute = pathname === '/'
  const isLoginApiRoute = pathname === '/api/auth/login'
  const isLogoutApiRoute = pathname === '/api/auth/logout'
  const isPublicRsvpRoute = pathname.startsWith('/rsvp/')
  const isPublicRsvpApiRoute = pathname.startsWith('/api/rsvp/')
  const isPhotoUploadRoute = pathname.startsWith('/photos/')

  if (isPublicRsvpRoute || isPublicRsvpApiRoute || isPhotoUploadRoute) {
    return withRobotsHeader(NextResponse.next())
  }

  const authToken = request.cookies.get('auth_token')?.value

  if (isLoginRoute || isLoginApiRoute) {
    if (authToken) {
      const validation = await validateSession.execute({ sessionToken: authToken })
      if (validation.isValid) {
        return withRobotsHeader(NextResponse.redirect(new URL('/admin', request.url)))
      }
    }
    return withRobotsHeader(NextResponse.next())
  }

  if (isAdminRoute || isAdminApiRoute || isLogoutApiRoute) {
    if (!authToken) {
      if (isAdminApiRoute || isLogoutApiRoute) {
        return withRobotsHeader(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      return withRobotsHeader(NextResponse.redirect(new URL('/', request.url)))
    }

    const validation = await validateSession.execute({ sessionToken: authToken })

    if (!validation.isValid) {
      if (isAdminApiRoute || isLogoutApiRoute) {
        return withRobotsHeader(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      return withRobotsHeader(NextResponse.redirect(new URL('/', request.url)))
    }

    const response = NextResponse.next()
    response.headers.set('x-admin-user-id', validation.adminUserId!)
    return withRobotsHeader(response)
  }

  return withRobotsHeader(NextResponse.next())
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/:path*', '/rsvp/:path*', '/api/rsvp/:path*', '/photos/:path*', '/'],
}
