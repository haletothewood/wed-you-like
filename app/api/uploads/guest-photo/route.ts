import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { DrizzleInviteRepository } from '@/infrastructure/database/repositories/DrizzleInviteRepository'

const inviteRepository = new DrizzleInviteRepository()

interface GuestUploadPayload {
  inviteToken?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}') as GuestUploadPayload
        const inviteToken = payload.inviteToken?.trim()

        if (!inviteToken) {
          throw new Error('Invite token is required')
        }

        const invite = await inviteRepository.findByToken(inviteToken)
        if (!invite) {
          throw new Error('Invalid invite token')
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            uploadType: 'guest_photo',
            inviteId: invite.id,
          }),
        }
      },
      onUploadCompleted: async () => {
        // No-op for now. We can persist metadata in DB in a follow-up PR.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Error generating guest photo upload token:', error)
    return NextResponse.json(
      { error: 'Failed to initialize guest photo upload' },
      { status: 400 }
    )
  }
}
