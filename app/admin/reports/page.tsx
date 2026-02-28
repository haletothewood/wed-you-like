'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ReportData {
  overview: {
    totalInvites: number
    invitesSent: number
    totalRsvps: number
    attending: number
    notAttending: number
    totalGuestsAttending: number
  }
  mealCounts: {
    STARTER: Array<{ name: string; description: string | null; count: number }>
    MAIN: Array<{ name: string; description: string | null; count: number }>
    DESSERT: Array<{ name: string; description: string | null; count: number }>
  }
  emailCampaigns: {
    totals: {
      sent: number
      failed: number
      failureRate: number
      lastSentAt: string | null
    }
    byTemplate: Array<{
      templateId: string
      templateName: string
      sent: number
      failed: number
      lastSentAt: string | null
    }>
    recentFailures: Array<{
      id: string
      eventType: 'invite_send' | 'test_send' | 'photo_share_send'
      templateName: string | null
      recipientEmail: string
      errorMessage: string | null
      createdAt: string
    }>
  }
}

const formatEventTypeLabel = (eventType: 'invite_send' | 'test_send' | 'photo_share_send'): string => {
  if (eventType === 'invite_send') return 'Invite Send'
  if (eventType === 'test_send') return 'Test Send'
  return 'Photo Share'
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [sendingPhotoCampaign, setSendingPhotoCampaign] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports')
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'guests' | 'meal-counts') => {
    setExporting(type)
    try {
      const response = await fetch(`/api/admin/reports/export-${type}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export data')
    } finally {
      setExporting(null)
    }
  }

  const handleSendPhotoShareCampaign = async () => {
    if (!confirm('Send the day-of photo share email to all invites with an email address?')) {
      return
    }

    setSendingPhotoCampaign(true)
    try {
      const response = await fetch('/api/admin/campaigns/photo-share', {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send photo share campaign')
      }

      alert(
        `Photo share campaign complete.\n\nSent: ${data.sent}\nSkipped (no email): ${data.skippedNoEmail}\nFailed: ${data.failed}`
      )
    } catch (error) {
      console.error('Error sending photo share campaign:', error)
      alert(error instanceof Error ? error.message : 'Failed to send photo share campaign')
    } finally {
      setSendingPhotoCampaign(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading reports..." />
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Reports & Statistics" description="View wedding RSVP statistics and export data" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load reports
          </CardContent>
        </Card>
      </div>
    )
  }

  const responseRate = data.overview.totalInvites > 0
    ? Math.round((data.overview.totalRsvps / data.overview.totalInvites) * 100)
    : 0

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Reports & Statistics"
        description="View wedding RSVP statistics and export data for your venue"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-primary">{data.overview.totalInvites}</CardTitle>
            <CardDescription>Total Invites Created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data.overview.invitesSent} sent via email
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-success">{data.overview.totalRsvps}</CardTitle>
            <CardDescription>Total Responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {responseRate}% response rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-accent">{data.overview.totalGuestsAttending}</CardTitle>
            <CardDescription>Total Guests Attending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data.overview.attending} invites confirmed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RSVP Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>RSVP Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-3xl font-bold text-success">{data.overview.attending}</div>
              <div className="text-sm text-muted-foreground mt-1">Attending</div>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <div className="text-3xl font-bold text-destructive">{data.overview.notAttending}</div>
              <div className="text-sm text-muted-foreground mt-1">Not Attending</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-muted-foreground">
                {data.overview.totalInvites - data.overview.totalRsvps}
              </div>
              <div className="text-sm text-muted-foreground mt-1">No Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Selection Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Meal Selection Breakdown</CardTitle>
          <CardDescription>Number of guests who selected each meal option</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Starters */}
          {data.mealCounts.STARTER.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>Starters</span>
                <Badge variant="outline">
                  {data.mealCounts.STARTER.reduce((sum, item) => sum + item.count, 0)} total
                </Badge>
              </h3>
              <div className="space-y-2">
                {data.mealCounts.STARTER.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    <Badge className="ml-4">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mains */}
          {data.mealCounts.MAIN.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>Main Courses</span>
                <Badge variant="outline">
                  {data.mealCounts.MAIN.reduce((sum, item) => sum + item.count, 0)} total
                </Badge>
              </h3>
              <div className="space-y-2">
                {data.mealCounts.MAIN.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    <Badge className="ml-4">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desserts */}
          {data.mealCounts.DESSERT.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>Desserts</span>
                <Badge variant="outline">
                  {data.mealCounts.DESSERT.reduce((sum, item) => sum + item.count, 0)} total
                </Badge>
              </h3>
              <div className="space-y-2">
                {data.mealCounts.DESSERT.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    <Badge className="ml-4">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.mealCounts.STARTER.length === 0 &&
           data.mealCounts.MAIN.length === 0 &&
           data.mealCounts.DESSERT.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No meal selections yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Email Campaign Analytics</CardTitle>
          <CardDescription>
            Delivery outcomes across invite sends, test sends, and photo-share campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-3xl font-bold text-success">{data.emailCampaigns.totals.sent}</div>
              <div className="text-sm text-muted-foreground mt-1">Emails Sent</div>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <div className="text-3xl font-bold text-destructive">{data.emailCampaigns.totals.failed}</div>
              <div className="text-sm text-muted-foreground mt-1">Email Failures</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-muted-foreground">{data.emailCampaigns.totals.failureRate}%</div>
              <div className="text-sm text-muted-foreground mt-1">Failure Rate</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">By Invite Template</h3>
            {data.emailCampaigns.byTemplate.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invite send events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.emailCampaigns.byTemplate.map((template) => (
                  <div
                    key={template.templateId}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 bg-muted rounded-lg gap-2"
                  >
                    <div>
                      <p className="font-medium">{template.templateName}</p>
                      <p className="text-xs text-muted-foreground">
                        Last sent:{' '}
                        {template.lastSentAt
                          ? new Date(template.lastSentAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Sent: {template.sent}</Badge>
                      <Badge variant={template.failed > 0 ? 'destructive' : 'secondary'}>
                        Failed: {template.failed}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3">Recent Failures</h3>
            {data.emailCampaigns.recentFailures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent email failures.</p>
            ) : (
              <div className="space-y-2">
                {data.emailCampaigns.recentFailures.map((failure) => (
                  <div key={failure.id} className="p-3 border rounded-lg">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="destructive">{formatEventTypeLabel(failure.eventType)}</Badge>
                      {failure.templateName && <Badge variant="outline">{failure.templateName}</Badge>}
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Recipient:</span> {failure.recipientEmail}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Error:</span>{' '}
                      <span className="text-muted-foreground">{failure.errorMessage || 'Unknown error'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(failure.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download reports as CSV files to share with your venue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Venue Report (Recommended)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Attending guests with table assignments and meal choices, plus meal count totals
              </p>
              <Button
                onClick={() => handleExport('guests')}
                disabled={exporting === 'guests'}
                className="w-full"
              >
                {exporting === 'guests' ? 'Exporting...' : '📥 Export Venue Report'}
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Meal Counts Only</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Just the meal totals by course type (for quick reference)
              </p>
              <Button
                onClick={() => handleExport('meal-counts')}
                disabled={exporting === 'meal-counts'}
                variant="secondary"
                className="w-full"
              >
                {exporting === 'meal-counts' ? 'Exporting...' : '📥 Export Meal Counts'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Day-Of Photo Share Campaign</CardTitle>
          <CardDescription>
            Send a separate email to all invites with a personal photo upload link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSendPhotoShareCampaign}
            disabled={sendingPhotoCampaign}
          >
            {sendingPhotoCampaign ? 'Sending...' : 'Send Photo Share Emails'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
