'use client'

import { useMemo, useState, useEffect } from 'react'
import { upload } from '@vercel/blob/client'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

type EditorMode = 'guided' | 'raw'

interface GuidedTemplateFields {
  heroTitle: string
  greetingLine: string
  introLine: string
  detailsHeading: string
  ctaLabel: string
  ctaHelpLine: string
  closingLine: string
  signoffLine: string
}

const templateVariables: Array<{
  key: string
  description: string
  optional: boolean
}> = [
  { key: 'partner1_name', description: 'First partner name', optional: false },
  { key: 'partner2_name', description: 'Second partner name', optional: false },
  { key: 'wedding_date', description: 'Wedding date', optional: false },
  { key: 'wedding_time', description: 'Wedding time', optional: false },
  { key: 'venue_name', description: 'Venue name', optional: false },
  { key: 'venue_address', description: 'Venue address', optional: false },
  { key: 'guest_name', description: 'Guest or group display name', optional: false },
  { key: 'rsvp_url', description: 'Unique RSVP link', optional: false },
  { key: 'adults_count', description: 'Number of invited adults', optional: false },
  { key: 'children_count', description: 'Number of invited children', optional: false },
  { key: 'dress_code', description: 'Dress code from wedding settings', optional: true },
  { key: 'rsvp_deadline', description: 'RSVP deadline from settings', optional: true },
  { key: 'registry_url', description: 'Registry URL from settings', optional: true },
  { key: 'additional_info', description: 'Additional info from settings', optional: true },
]

const samplePreviewValues: Record<string, string | number> = {
  partner1_name: 'Alex',
  partner2_name: 'David',
  wedding_date: 'Saturday, June 15th, 2026',
  wedding_time: '4:00 PM',
  venue_name: 'The Grand Hall',
  venue_address: '123 Celebration Lane, London',
  dress_code: 'Cocktail Attire',
  rsvp_deadline: 'May 1st, 2026',
  registry_url: 'https://example.com/registry',
  additional_info: 'Ceremony starts promptly at 4:00 PM.',
  guest_name: 'Test Guest',
  rsvp_url: 'https://example.com/rsvp/test-link',
  adults_count: 2,
  children_count: 0,
}

const defaultGuidedFields: GuidedTemplateFields = {
  heroTitle: "You're Invited!",
  greetingLine: 'Dear {{guest_name}},',
  introLine: "We're so excited to invite you to celebrate our wedding with us.",
  detailsHeading: 'Wedding Details',
  ctaLabel: 'RSVP Now',
  ctaHelpLine: "If the button doesn't work, use this link: {{rsvp_url}}",
  closingLine: "We can't wait to celebrate with you.",
  signoffLine: 'With love,<br>{{partner1_name}} & {{partner2_name}}',
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>')

const generateGuidedTemplateHtml = (fields: GuidedTemplateFields): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #f7f7f7; color: #222;">
  <div style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 14px rgba(0,0,0,0.08);">
    <h1 style="margin: 0 0 10px 0; color: #333; text-align: center;">${escapeHtml(fields.heroTitle)}</h1>
    <p style="text-align: center; margin: 0 0 24px 0; color: #555;">{{partner1_name}} & {{partner2_name}}</p>

    <p>${escapeHtml(fields.greetingLine)}</p>
    <p>${escapeHtml(fields.introLine)}</p>

    <div style="background: #f2f2f2; border-radius: 10px; padding: 16px; margin: 22px 0;">
      <p style="margin: 0 0 8px 0; font-weight: bold;">${escapeHtml(fields.detailsHeading)}</p>
      <p style="margin: 4px 0;"><strong>Date:</strong> {{wedding_date}}</p>
      <p style="margin: 4px 0;"><strong>Time:</strong> {{wedding_time}}</p>
      <p style="margin: 4px 0;"><strong>Venue:</strong> {{venue_name}}</p>
      <p style="margin: 4px 0;">{{venue_address}}</p>
      <p style="margin: 4px 0;"><strong>Dress code:</strong> {{dress_code}}</p>
      <p style="margin: 4px 0;"><strong>RSVP by:</strong> {{rsvp_deadline}}</p>
    </div>

    <div style="text-align: center; margin: 26px 0;">
      <a href="{{rsvp_url}}" style="display: inline-block; background: #2d6cdf; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        ${escapeHtml(fields.ctaLabel)}
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">${escapeHtml(fields.ctaHelpLine)}</p>
    <p>${escapeHtml(fields.closingLine)}</p>
    <p>${fields.signoffLine.replace(/\n/g, '<br>')}</p>
  </div>
</body>
</html>`

const renderTemplate = (
  template: string,
  variables: Record<string, string | number | undefined>
): string => {
  let rendered = template
  for (const [key, value] of Object.entries(variables)) {
    const replacement = value === undefined || value === null ? '' : String(value)
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), replacement)
  }
  return rendered
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('guided')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testSendMessage, setTestSendMessage] = useState('')
  const [testSendError, setTestSendError] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)

  const [name, setName] = useState('')
  const [templateType, setTemplateType] = useState<'invite' | 'thank_you'>('invite')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [guidedFields, setGuidedFields] = useState<GuidedTemplateFields>(defaultGuidedFields)
  const previewSubject = useMemo(
    () => renderTemplate(subject || '(No subject)', samplePreviewValues),
    [subject]
  )
  const previewHtml = useMemo(
    () =>
      renderTemplate(
        htmlContent ||
          '<p style="font-family: Arial, sans-serif;">Add template HTML to see a preview.</p>',
        samplePreviewValues
      ),
    [htmlContent]
  )

  useEffect(() => {
    fetchTemplates()
  }, [])

  const resetForm = () => {
    setName('')
    setTemplateType('invite')
    setEditorMode('guided')
    setSubject('')
    setGuidedFields(defaultGuidedFields)
    setHtmlContent(generateGuidedTemplateHtml(defaultGuidedFields))
    setHeroImageUrl('')
    setEditingId(null)
    setTestEmail('')
    setTestSendMessage('')
    setTestSendError(false)
  }

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

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
    setMessage('')
    setTestSendMessage('')
  }

  const openEditForm = (template: EmailTemplate) => {
    setEditorMode('guided')
    setEditingId(template.id)
    setName(template.name)
    setTemplateType(template.templateType)
    setSubject(template.subject)
    setHtmlContent(template.htmlContent)
    setHeroImageUrl(template.heroImageUrl || '')
    setShowForm(true)
    setMessage('')
    setTestSendMessage('')
  }

  const updateGuidedField = (field: keyof GuidedTemplateFields, value: string) => {
    setGuidedFields((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const applyGuidedTemplate = () => {
    setHtmlContent(generateGuidedTemplateHtml(guidedFields))
  }

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
    setMessage('')
    setTestSendMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const payload = {
        subject,
        htmlContent,
        heroImageUrl: heroImageUrl.trim() || undefined,
      }

      let response: Response

      if (editingId) {
        response = await fetch(`/api/admin/email-templates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/admin/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            templateType,
            ...payload,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      setMessage(editingId ? 'Template updated successfully' : 'Template created successfully')
      setIsError(false)
      resetForm()
      setShowForm(false)
      await fetchTemplates()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save template')
      setIsError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setTestSendMessage('Please enter a test email address')
      setTestSendError(true)
      return
    }

    setSendingTest(true)
    setTestSendMessage('')

    try {
      const response = await fetch('/api/admin/email-templates/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testEmail.trim(),
          subject,
          htmlContent,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email')
      }

      setTestSendMessage(`Test email sent to ${data.sentTo}`)
      setTestSendError(false)
    } catch (error) {
      setTestSendMessage(error instanceof Error ? error.message : 'Failed to send test email')
      setTestSendError(true)
    } finally {
      setSendingTest(false)
    }
  }

  const handleHeroImageUpload = async (file: File) => {
    setUploadingHeroImage(true)
    setMessage('')

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/uploads/hero-image',
      })

      setHeroImageUrl(blob.url)
      setMessage('Hero image uploaded successfully')
      setIsError(false)
    } catch (error) {
      console.error('Hero image upload failed:', error)
      setMessage('Failed to upload hero image')
      setIsError(true)
    } finally {
      setUploadingHeroImage(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete template')
      }
      setMessage('Template deleted successfully')
      setIsError(false)
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      setMessage('Failed to delete template')
      setIsError(true)
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
        action={
          <Button onClick={openCreateForm}>
            Create Template
          </Button>
        }
      />

      {message && (
        <Alert variant={isError ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Email Template' : 'Create Email Template'}</CardTitle>
            <CardDescription>
              {editingId
                ? 'Update subject, body, and hero image URL for this template'
                : 'Create a new invitation or thank-you email template'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={!!editingId}
                    placeholder="e.g., Main Wedding Invite"
                  />
                  {editingId && (
                    <p className="text-xs text-muted-foreground">
                      Template name cannot be changed yet.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={templateType}
                    onValueChange={(value) => setTemplateType(value as 'invite' | 'thank_you')}
                    disabled={!!editingId}
                  >
                    <SelectTrigger id="template-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invite">Invitation</SelectItem>
                      <SelectItem value="thank_you">Thank You</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingId && (
                    <p className="text-xs text-muted-foreground">
                      Template type cannot be changed yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="template-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="e.g., You're Invited to {{partner1_name}} & {{partner2_name}}'s Wedding"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-hero">Hero Image URL (optional)</Label>
                <Input
                  id="template-hero"
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="max-w-sm"
                    disabled={uploadingHeroImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void handleHeroImageUpload(file)
                      e.currentTarget.value = ''
                    }}
                  />
                  {uploadingHeroImage && (
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  )}
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Template Editor Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Guided mode generates HTML. Raw mode gives full HTML control.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={editorMode === 'guided' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('guided')}
                    >
                      Guided
                    </Button>
                    <Button
                      type="button"
                      variant={editorMode === 'raw' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('raw')}
                    >
                      Raw HTML
                    </Button>
                  </div>
                </div>

                {editorMode === 'guided' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="guided-hero-title">Hero title</Label>
                        <Input
                          id="guided-hero-title"
                          value={guidedFields.heroTitle}
                          onChange={(e) => updateGuidedField('heroTitle', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="guided-cta-label">CTA button label</Label>
                        <Input
                          id="guided-cta-label"
                          value={guidedFields.ctaLabel}
                          onChange={(e) => updateGuidedField('ctaLabel', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guided-greeting-line">Greeting line</Label>
                      <Input
                        id="guided-greeting-line"
                        value={guidedFields.greetingLine}
                        onChange={(e) => updateGuidedField('greetingLine', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guided-intro-line">Intro line</Label>
                      <Textarea
                        id="guided-intro-line"
                        rows={2}
                        value={guidedFields.introLine}
                        onChange={(e) => updateGuidedField('introLine', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guided-details-heading">Details heading</Label>
                      <Input
                        id="guided-details-heading"
                        value={guidedFields.detailsHeading}
                        onChange={(e) => updateGuidedField('detailsHeading', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guided-cta-help-line">CTA help line</Label>
                      <Input
                        id="guided-cta-help-line"
                        value={guidedFields.ctaHelpLine}
                        onChange={(e) => updateGuidedField('ctaHelpLine', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guided-closing-line">Closing line</Label>
                      <Input
                        id="guided-closing-line"
                        value={guidedFields.closingLine}
                        onChange={(e) => updateGuidedField('closingLine', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guided-signoff-line">Sign-off line (supports simple HTML)</Label>
                      <Input
                        id="guided-signoff-line"
                        value={guidedFields.signoffLine}
                        onChange={(e) => updateGuidedField('signoffLine', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" onClick={applyGuidedTemplate}>
                        Apply Guided Template to HTML
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        This updates the HTML used for preview, test-send, and save.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="template-html">
                      HTML Content <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="template-html"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      required
                      rows={14}
                      className="font-mono text-xs"
                      placeholder="<html>...</html>"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Live Preview</p>
                  <p className="text-xs text-muted-foreground">
                    Preview uses sample values for placeholders.
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Subject:</span>{' '}
                  <span className="text-muted-foreground">{previewSubject}</span>
                </div>
                <div className="rounded border bg-background overflow-hidden">
                  <iframe
                    title="Template preview"
                    srcDoc={previewHtml}
                    className="w-full h-[360px] bg-white"
                  />
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-2">Available placeholders</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Optional placeholders are safe to use. If the value is missing, it renders as blank.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templateVariables.map((variable) => (
                    <div key={variable.key} className="text-xs">
                      <code>{`{{${variable.key}}}`}</code>
                      <span className="text-muted-foreground"> - {variable.description}</span>
                      {variable.optional && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Optional
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Test Send</p>
                  <p className="text-xs text-muted-foreground">
                    Sends this current subject and HTML content to a test inbox.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest || !subject.trim() || !htmlContent.trim()}
                  >
                    {sendingTest ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
                {testSendMessage && (
                  <Alert variant={testSendError ? 'destructive' : 'default'}>
                    <AlertDescription>{testSendMessage}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Template'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 ? (
        <EmptyState
          title="No email templates found"
          description="Create your first template to start sending invitations."
          action={<Button onClick={openCreateForm}>Create First Template</Button>}
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openEditForm(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      Delete
                    </Button>
                  </div>
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
