'use client'

import { useState, useEffect } from 'react'

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
      } else {
        const data = await response.json()
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving wedding settings:', error)
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Wedding Settings</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Partner 1 Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.partner1Name}
              onChange={(e) =>
                setSettings({ ...settings, partner1Name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., John"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Partner 2 Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.partner2Name}
              onChange={(e) =>
                setSettings({ ...settings, partner2Name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., David"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Wedding Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.weddingDate}
              onChange={(e) =>
                setSettings({ ...settings, weddingDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
              placeholder="Saturday, June 15th, 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Wedding Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.weddingTime}
              onChange={(e) =>
                setSettings({ ...settings, weddingTime: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
              placeholder="4:00 PM"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Venue Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={settings.venueName}
            onChange={(e) =>
              setSettings({ ...settings, venueName: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Venue Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={settings.venueAddress}
            onChange={(e) =>
              setSettings({ ...settings, venueAddress: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Dress Code (optional)
          </label>
          <input
            type="text"
            value={settings.dressCode}
            onChange={(e) =>
              setSettings({ ...settings, dressCode: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Black Tie, Cocktail Attire"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            RSVP Deadline (optional)
          </label>
          <input
            type="text"
            value={settings.rsvpDeadline}
            onChange={(e) =>
              setSettings({ ...settings, rsvpDeadline: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., May 1st, 2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Registry URL (optional)
          </label>
          <input
            type="url"
            value={settings.registryUrl}
            onChange={(e) =>
              setSettings({ ...settings, registryUrl: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="https://registry.example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Additional Info (optional)
          </label>
          <textarea
            value={settings.additionalInfo}
            onChange={(e) =>
              setSettings({ ...settings, additionalInfo: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            rows={3}
            placeholder="Any additional information for guests"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              message.includes('Error')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
