'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WeddingSettings {
  partner1Name: string
  partner2Name: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueAddress: string
  dressCode?: string
  rsvpDeadline?: string
  registryUrl?: string
  additionalInfo?: string
}

export default function WeddingSettingsPage() {
  const [settings, setSettings] = useState<WeddingSettings>({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    weddingTime: '',
    venueName: '',
    venueAddress: '',
    dressCode: '',
    rsvpDeadline: '',
    registryUrl: '',
    additionalInfo: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/wedding-settings')
      const data = await response.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching wedding settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/wedding-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage('Wedding settings saved successfully!')
        setIsError(false)
      } else {
        const data = await response.json()
        setMessage(`Error: ${data.error}`)
        setIsError(true)
      }
    } catch (error) {
      console.error('Error saving wedding settings:', error)
      setMessage('Failed to save settings')
      setIsError(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading wedding settings..." />
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Wedding Settings"
        description="Configure your wedding details and venue information"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Wedding Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner1">
                  Partner 1 Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partner1"
                  type="text"
                  value={settings.partner1Name}
                  onChange={(e) =>
                    setSettings({ ...settings, partner1Name: e.target.value })
                  }
                  placeholder="e.g., John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner2">
                  Partner 2 Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partner2"
                  type="text"
                  value={settings.partner2Name}
                  onChange={(e) =>
                    setSettings({ ...settings, partner2Name: e.target.value })
                  }
                  placeholder="e.g., David"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Wedding Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="text"
                  value={settings.weddingDate}
                  onChange={(e) =>
                    setSettings({ ...settings, weddingDate: e.target.value })
                  }
                  placeholder="Saturday, June 15th, 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">
                  Wedding Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="time"
                  type="text"
                  value={settings.weddingTime}
                  onChange={(e) =>
                    setSettings({ ...settings, weddingTime: e.target.value })
                  }
                  placeholder="4:00 PM"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">
                Venue Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue"
                type="text"
                value={settings.venueName}
                onChange={(e) =>
                  setSettings({ ...settings, venueName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Venue Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={settings.venueAddress}
                onChange={(e) =>
                  setSettings({ ...settings, venueAddress: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dressCode">Dress Code (optional)</Label>
              <Input
                id="dressCode"
                type="text"
                value={settings.dressCode}
                onChange={(e) =>
                  setSettings({ ...settings, dressCode: e.target.value })
                }
                placeholder="e.g., Black Tie, Cocktail Attire"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvpDeadline">RSVP Deadline (optional)</Label>
              <Input
                id="rsvpDeadline"
                type="text"
                value={settings.rsvpDeadline}
                onChange={(e) =>
                  setSettings({ ...settings, rsvpDeadline: e.target.value })
                }
                placeholder="e.g., May 1st, 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registry">Registry URL (optional)</Label>
              <Input
                id="registry"
                type="url"
                value={settings.registryUrl}
                onChange={(e) =>
                  setSettings({ ...settings, registryUrl: e.target.value })
                }
                placeholder="https://registry.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Info (optional)</Label>
              <Textarea
                id="additionalInfo"
                value={settings.additionalInfo}
                onChange={(e) =>
                  setSettings({ ...settings, additionalInfo: e.target.value })
                }
                rows={3}
                placeholder="Any additional information for guests"
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>

            {message && (
              <Alert variant={isError ? 'destructive' : 'default'}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
