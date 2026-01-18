'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
    return <LoadingSpinner text="Loading email templates..." />
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Email Templates"
        description="Manage email templates for invitations and thank you messages"
      />

      {templates.length === 0 ? (
        <EmptyState
          title="No email templates found"
          description="Use seed scripts to create default templates, or add create functionality."
        />
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {template.templateType === 'invite' ? 'Invitation' : 'Thank You'}
                      </Badge>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>{' '}
                    <span className="text-muted-foreground">{template.subject}</span>
                  </div>
                  {template.heroImageUrl && (
                    <div>
                      <span className="font-medium">Hero Image:</span>{' '}
                      <span className="text-muted-foreground truncate">{template.heroImageUrl}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Last Updated:</span>{' '}
                    <span className="text-muted-foreground">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
