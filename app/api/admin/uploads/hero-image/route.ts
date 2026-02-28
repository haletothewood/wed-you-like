import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ uploadType: 'hero_image' }),
      }),
      onUploadCompleted: async () => {
        // No-op for now. URL is returned to the client and stored in template data.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Error generating hero image upload token:', error)
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 400 }
    )
  }
}
