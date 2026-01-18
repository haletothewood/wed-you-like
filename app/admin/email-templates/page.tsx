'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
  id: string
  name: string
  templateType: 'invite' | 'thank_you'
  subject: string
  htmlContent: string
  heroImageUrl?: string
  isActive: boolean
  updatedAt: string
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' })
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Email Templates</h1>

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-600">
                  Type: {template.templateType} | Active: {template.isActive ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Subject: {template.subject}
                </p>
              </div>
              <button
                onClick={() => handleDelete(template.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Tip: Use seed scripts to create default templates, or add create/edit UI here.
        </p>
      </div>
    </div>
  )
}
