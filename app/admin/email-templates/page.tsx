'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
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

const defaultPreviewValues: Record<string, string | number> = {
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
<body style="font-family: 'Avenir Next', Figtree, 'Trebuchet MS', sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #ecebe1; color: #1d1d1b;">
  <div style="background: #f5f4ee; border: 1px solid #d2d1c3; border-radius: 12px; padding: 30px; box-shadow: 0 2px 14px rgba(29,29,27,0.08);">
    <h1 style="margin: 0 0 10px 0; color: #5b623f; text-align: center;">${escapeHtml(fields.heroTitle)}</h1>
    <p style="text-align: center; margin: 0 0 24px 0; color: #4f4f46;">{{partner1_name}} & {{partner2_name}}</p>

    <p>${escapeHtml(fields.greetingLine)}</p>
    <p>${escapeHtml(fields.introLine)}</p>

    <div style="background: #e7e6dc; border: 1px solid #d2d1c3; border-radius: 10px; padding: 16px; margin: 22px 0;">
      <p style="margin: 0 0 8px 0; font-weight: bold;">${escapeHtml(fields.detailsHeading)}</p>
      <p style="margin: 4px 0;"><strong>Date:</strong> {{wedding_date}}</p>
      <p style="margin: 4px 0;"><strong>Time:</strong> {{wedding_time}}</p>
      <p style="margin: 4px 0;"><strong>Venue:</strong> {{venue_name}}</p>
      <p style="margin: 4px 0;">{{venue_address}}</p>
      <p style="margin: 4px 0;"><strong>Dress code:</strong> {{dress_code}}</p>
      <p style="margin: 4px 0;"><strong>RSVP by:</strong> {{rsvp_deadline}}</p>
    </div>

    <div style="text-align: center; margin: 26px 0;">
      <a href="{{rsvp_url}}" style="display: inline-block; background: #5b623f; color: #ecebe1; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        ${escapeHtml(fields.ctaLabel)}
      </a>
    </div>

    <p style="font-size: 14px; color: #5f5f56;">${escapeHtml(fields.ctaHelpLine)}</p>
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

const injectHeroImageIntoHtml = (html: string, imageUrl: string): string => {
  const trimmedUrl = imageUrl.trim()
  if (!trimmedUrl) return html

  const safeUrl = trimmedUrl.replace(/"/g, '&quot;')
  const heroImageBlock = `
    <div style="margin: 0 0 20px 0; text-align: center;">
      <img src="${safeUrl}" alt="Hero" style="max-width: 100%; height: auto; border-radius: 12px;" />
    </div>
  `

  const bodyOpenTagMatch = html.match(/<body[^>]*>/i)
  if (!bodyOpenTagMatch || !bodyOpenTagMatch[0]) {
    return `${heroImageBlock}${html}`
  }

  return html.replace(bodyOpenTagMatch[0], `${bodyOpenTagMatch[0]}${heroImageBlock}`)
}

const applyThemePaletteToHtml = (html: string): string => {
  const replacements: Array<[RegExp, string]> = [
    [/#667eea/gi, '#5b623f'],
    [/#2d6cdf/gi, '#5b623f'],
    [/#e74c3c/gi, '#1d1d1b'],
    [/#fff\b/gi, '#ecebe1'],
    [/\bwhite\b/gi, '#ecebe1'],
    [/#f9f9f9/gi, '#ecebe1'],
    [/#f7f7f7/gi, '#ecebe1'],
    [/#f5f5f5/gi, '#e7e6dc'],
    [/#f2f2f2/gi, '#e7e6dc'],
    [/#ddd\b/gi, '#d2d1c3'],
    [/#777\b/gi, '#5f5f56'],
    [/#666\b/gi, '#5f5f56'],
    [/#555\b/gi, '#4f4f46'],
    [/#333\b/gi, '#1d1d1b'],
  ]

  let updated = html
  for (const [pattern, next] of replacements) {
    updated = updated.replace(pattern, next)
  }

  return updated
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
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
  const [heroImagePreviewUrl, setHeroImagePreviewUrl] = useState('')
  const [heroImageFileName, setHeroImageFileName] = useState('')
  const [heroImageInputKey, setHeroImageInputKey] = useState(0)
  const effectiveHeroImagePreviewUrl = heroImagePreviewUrl || heroImageUrl
  const [guidedFields, setGuidedFields] = useState<GuidedTemplateFields>(defaultGuidedFields)
  const [previewValues, setPreviewValues] = useState<Record<string, string | number>>(defaultPreviewValues)
  const previewSubject = useMemo(
    () => renderTemplate(subject || '(No subject)', previewValues),
    [previewValues, subject]
  )
  const previewHtml = useMemo(
    () =>
      injectHeroImageIntoHtml(
        renderTemplate(
          htmlContent ||
            '<p style="font-family: Arial, sans-serif;">Add template HTML to see a preview.</p>',
          previewValues
        ),
        effectiveHeroImagePreviewUrl
      ),
    [effectiveHeroImagePreviewUrl, htmlContent, previewValues]
  )
  const hasLegacyPalette = useMemo(
    () => /#667eea|#2d6cdf|#e74c3c|#f9f9f9|#f7f7f7|#f5f5f5|#f2f2f2|#ddd\b|#777\b|#666\b|#555\b|#333\b|\bwhite\b|#fff\b/i.test(htmlContent),
    [htmlContent]
  )

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    return () => {
      if (heroImagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(heroImagePreviewUrl)
      }
    }
  }, [heroImagePreviewUrl])

  const getUploadErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = String((error as { message?: unknown }).message ?? '')
      if (message.trim()) {
        return message
      }
    }

    return 'Failed to upload hero image'
  }

  const resetForm = () => {
    setName('')
    setTemplateType('invite')
    setEditorMode('guided')
    setSubject('')
    setGuidedFields(defaultGuidedFields)
    setHtmlContent(generateGuidedTemplateHtml(defaultGuidedFields))
    setHeroImageUrl('')
    setHeroImagePreviewUrl('')
    setHeroImageFileName('')
    setHeroImageInputKey((prev) => prev + 1)
    setPreviewValues(defaultPreviewValues)
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
    setEditorMode('raw')
    setEditingId(template.id)
    setName(template.name)
    setTemplateType(template.templateType)
    setSubject(template.subject)
    setHtmlContent(template.htmlContent)
    setHeroImageUrl(template.heroImageUrl || '')
    setHeroImagePreviewUrl(template.heroImageUrl || '')
    setHeroImageFileName('')
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

  const handleApplyThemePalette = () => {
    const themedHtml = applyThemePaletteToHtml(htmlContent)
    if (themedHtml === htmlContent) {
      setMessage('No legacy palette colors found in current HTML')
      setIsError(false)
      return
    }

    setHtmlContent(themedHtml)
    setMessage('Theme colors applied to current HTML. Save template to persist.')
    setIsError(false)
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
          heroImageUrl: heroImageUrl || undefined,
          previewOverrides: previewValues,
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
    const maxSizeInBytes = 25 * 1024 * 1024

    if (file.size > maxSizeInBytes) {
      setMessage('Image is too large. Please upload a file under 25MB.')
      setIsError(true)
      return
    }

    setUploadingHeroImage(true)
    setMessage('')
    setHeroImageFileName(file.name)
    const localPreviewUrl = URL.createObjectURL(file)
    if (heroImagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(heroImagePreviewUrl)
    }
    setHeroImagePreviewUrl(localPreviewUrl)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pathname', file.name)

      const response = await fetch('/api/admin/uploads/hero-image', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload hero image')
      }

      setHeroImageUrl(data.url)
      setMessage('Hero image uploaded successfully')
      setIsError(false)
    } catch (error) {
      console.error('Hero image upload failed:', error)
      setMessage(getUploadErrorMessage(error))
      setIsError(true)
      URL.revokeObjectURL(localPreviewUrl)
      setHeroImagePreviewUrl(heroImageUrl)
    } finally {
      setUploadingHeroImage(false)
    }
  }

  const handleRemoveHeroImage = () => {
    if (heroImagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(heroImagePreviewUrl)
    }
    setHeroImageUrl('')
    setHeroImagePreviewUrl('')
    setHeroImageFileName('')
    setHeroImageInputKey((prev) => prev + 1)
  }

  const updatePreviewValue = (key: string, value: string) => {
    setPreviewValues((prev) => ({
      ...prev,
      [key]:
        key === 'adults_count' || key === 'children_count'
          ? Number(value || 0)
          : value,
    }))
  }

  const handleDelete = async (id: string) => {
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
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Email Templates"
        description="Manage email templates for invitations and thank you messages"
        action={
          <Button onClick={openCreateForm} className="w-full sm:w-auto">
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
                ? 'Update subject, body, and hero image for this template'
                : 'Create a new invitation or thank-you email template'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label htmlFor="template-hero-file">Hero Image (optional)</Label>
                {effectiveHeroImagePreviewUrl && (
                  <div className="rounded-md border p-2 bg-muted/20 max-w-sm">
                    <Image
                      src={effectiveHeroImagePreviewUrl}
                      alt="Hero image preview"
                      width={1200}
                      height={675}
                      unoptimized
                      loader={({ src }) => src}
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}
                {heroImageUrl.includes('.private.blob.vercel-storage.com') && (
                  <p className="text-xs text-muted-foreground">
                    Stored in a private blob. Browser preview may be unavailable outside authenticated
                    contexts.
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Input
                    key={heroImageInputKey}
                    id="template-hero-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="max-w-sm"
                    disabled={uploadingHeroImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void handleHeroImageUpload(file)
                    }}
                  />
                  {(heroImageUrl || heroImagePreviewUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveHeroImage}
                      disabled={uploadingHeroImage}
                    >
                      Remove image
                    </Button>
                  )}
                  {uploadingHeroImage && (
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  )}
                </div>
                {(heroImageFileName || heroImageUrl) && (
                  <p className="text-xs text-muted-foreground">
                    {heroImageFileName
                      ? `Current image: ${heroImageFileName}`
                      : 'Current image uploaded'}
                  </p>
                )}
              </div>

              <div className="rounded-md border p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Template Editor Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Guided mode generates HTML. Raw mode gives full HTML control.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyThemePalette}
                    >
                      {hasLegacyPalette ? 'Apply Theme Colors' : 'Theme Colors Applied'}
                    </Button>
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
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
                <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium">Preview placeholder values</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewValues(defaultPreviewValues)}
                    >
                      Reset Preview Values
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {templateVariables.map((variable) => (
                      <div key={variable.key} className="space-y-1">
                        <Label htmlFor={`preview-${variable.key}`} className="text-xs">
                          {variable.key}
                        </Label>
                        <Input
                          id={`preview-${variable.key}`}
                          value={String(previewValues[variable.key] ?? '')}
                          type={variable.key === 'adults_count' || variable.key === 'children_count' ? 'number' : 'text'}
                          onChange={(e) => updatePreviewValue(variable.key, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-2">Available placeholders</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Optional placeholders are safe to use. If the value is missing, it renders as blank.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <div className="flex flex-col gap-2 sm:flex-row">
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Template'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting} className="w-full sm:w-auto">
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => openEditForm(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setPendingDeleteId(template.id)}
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
                      <Badge variant="secondary">Attached</Badge>
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
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null)
          }
        }}
        title="Delete template"
        description="This email template will be removed and can no longer be used for sends."
        confirmLabel="Delete template"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!pendingDeleteId) return
          const id = pendingDeleteId
          setPendingDeleteId(null)
          void handleDelete(id)
        }}
      />
    </div>
  )
}
