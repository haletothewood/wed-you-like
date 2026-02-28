'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InviteDetails {
  groupName: string | null
  guests: Array<{ name: string }>
}

export default function PhotoUploadPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [photoUploadMessage, setPhotoUploadMessage] = useState('')
  const [photoUploadError, setPhotoUploadError] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])

  const fetchInvite = useCallback(async () => {
    try {
      const response = await fetch(`/api/rsvp/${token}`)
      if (!response.ok) {
        throw new Error('Invite not found')
      }
      const data = await response.json()
      setInvite(data.invite)
    } catch {
      setError('Photo upload link is invalid or no longer available.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInvite()
  }, [fetchInvite])

  const handleGuestPhotoUpload = async (file: File) => {
    setPhotoUploading(true)
    setPhotoUploadMessage('')

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/uploads/guest-photo',
        clientPayload: JSON.stringify({ inviteToken: token }),
      })

      setUploadedPhotoUrls((prev) => [blob.url, ...prev])
      setPhotoUploadMessage('Photo uploaded successfully. Thank you for sharing!')
      setPhotoUploadError(false)
    } catch (uploadError) {
      console.error('Guest photo upload failed:', uploadError)
      setPhotoUploadMessage('Failed to upload photo. Please try again.')
      setPhotoUploadError(true)
    } finally {
      setPhotoUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner text="Loading your photo upload link..." />
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Unable to Open Upload Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error || 'Invalid link'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayName = invite.groupName || invite.guests[0]?.name || 'Guest'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Share Your Wedding Photos</CardTitle>
            <CardDescription>
              Thanks for celebrating with us, {displayName}. Upload your photos below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={photoUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  void handleGuestPhotoUpload(file)
                  e.currentTarget.value = ''
                }}
              />
              {photoUploading && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>

            {photoUploadMessage && (
              <Alert variant={photoUploadError ? 'destructive' : 'default'}>
                <AlertDescription>{photoUploadMessage}</AlertDescription>
              </Alert>
            )}

            {uploadedPhotoUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recently uploaded</p>
                <div className="space-y-1">
                  {uploadedPhotoUrls.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-primary underline truncate"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
