import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request): Promise<NextResponse> {
  const maxSizeInBytes = 25 * 1024 * 1024
  const blobAccess = process.env.BLOB_HERO_IMAGE_ACCESS === 'public' ? 'public' : 'private'
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ])

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

    const mimeType = file.type.trim().toLowerCase()
    if (!allowedMimeTypes.has(mimeType)) {
      return NextResponse.json(
        { error: 'Unsupported image type. Please upload JPEG, PNG, WebP, HEIC, or HEIF.' },
        { status: 400 }
      )
    }

    const pathname =
      typeof pathnameInput === 'string' && pathnameInput.trim()
        ? pathnameInput.trim()
        : file.name
    const fileName = pathname.split(/[\\/]/).pop() || 'upload'
    const safePathname = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^_+/, '')
      .slice(0, 120) || 'upload'

    const blob = await put(`hero-images/${safePathname}`, file, {
      access: blobAccess,
      addRandomSuffix: true,
      contentType: mimeType,
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
