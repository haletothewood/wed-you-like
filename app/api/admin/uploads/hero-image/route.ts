import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request): Promise<NextResponse> {
  const maxSizeInBytes = 25 * 1024 * 1024
  const blobAccess = process.env.BLOB_HERO_IMAGE_ACCESS === 'public' ? 'public' : 'private'

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const pathnameInput = formData.get('pathname')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: 'Image is too large. Please upload a file under 25MB.' },
        { status: 400 }
      )
    }

    const pathname =
      typeof pathnameInput === 'string' && pathnameInput.trim()
        ? pathnameInput.trim()
        : file.name
    const safePathname = pathname.replace(/^\/+/, '')

    const blob = await put(`hero-images/${safePathname}`, file, {
      access: blobAccess,
      addRandomSuffix: true,
      contentType: file.type || undefined,
      multipart: false,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Error uploading hero image:', error)

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to upload hero image'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
