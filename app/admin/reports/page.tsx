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
  seatingSummary: Array<{
    id: string
    name: string
    tableNumber: number
    capacity: number
    assignedSeats: number
    availableSeats: number
    isFull: boolean
  }>
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [sendingPhotoCampaign, setSendingPhotoCampaign] = useState(false)
  const [sendingReminderCampaign, setSendingReminderCampaign] = useState(false)
  const [sendingThankYouCampaign, setSendingThankYouCampaign] = useState(false)

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
      if (!response.ok) {
        let message = 'Failed to export data'
        try {
          const data = await response.json()
          if (typeof data?.error === 'string' && data.error.trim()) {
            message = data.error
          }
        } catch {
          // ignore JSON parsing failures and keep fallback message
        }
        throw new Error(message)
      }

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

  const handleSendReminderCampaign = async () => {
    if (!confirm('Send RSVP reminder emails to pending invites (sent invites with no RSVP yet)?')) {
      return
    }

    setSendingReminderCampaign(true)
    try {
      const response = await fetch('/api/admin/campaigns/rsvp-reminder', {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send RSVP reminder campaign')
      }

      alert(
        `RSVP reminder campaign complete.\n\nEligible pending: ${data.eligiblePending}\nSent: ${data.sent}\nSkipped (not sent yet): ${data.skippedNotSent}\nSkipped (already responded): ${data.skippedAlreadyResponded}\nSkipped (no email): ${data.skippedNoEmail}\nFailed: ${data.failed}`
      )
    } catch (error) {
      console.error('Error sending RSVP reminder campaign:', error)
      alert(error instanceof Error ? error.message : 'Failed to send RSVP reminder campaign')
    } finally {
      setSendingReminderCampaign(false)
    }
  }

  const handleSendThankYouCampaign = async () => {
    if (!confirm('Send thank-you emails to attending invites that have not already received one?')) {
      return
    }

    setSendingThankYouCampaign(true)
    try {
      const response = await fetch('/api/admin/campaigns/thank-you', {
        method: 'POST',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send thank-you campaign')
      }

      alert(
        `Thank-you campaign complete.\n\nEligible attending: ${data.eligibleAttending}\nSent: ${data.sent}\nSkipped (not sent invite): ${data.skippedNotSent}\nSkipped (not attending): ${data.skippedNotAttending}\nSkipped (already thanked): ${data.skippedAlreadyThanked}\nSkipped (no email): ${data.skippedNoEmail}\nFailed: ${data.failed}`
      )
    } catch (error) {
      console.error('Error sending thank-you campaign:', error)
      alert(error instanceof Error ? error.message : 'Failed to send thank-you campaign')
    } finally {
      setSendingThankYouCampaign(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading reports..." />
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reports & Statistics"
        description="View wedding RSVP statistics and export data for your venue"
      />

      {/* Overview Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary sm:text-4xl">{data.overview.totalInvites}</CardTitle>
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
            <CardTitle className="text-3xl font-bold text-success sm:text-4xl">{data.overview.totalRsvps}</CardTitle>
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
            <CardTitle className="text-3xl font-bold text-accent sm:text-4xl">{data.overview.totalGuestsAttending}</CardTitle>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div key={index} className="flex flex-col gap-2 rounded-lg bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <div key={index} className="flex flex-col gap-2 rounded-lg bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <div key={index} className="flex flex-col gap-2 rounded-lg bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
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

      {/* Seating Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Table Seating Summary</CardTitle>
          <CardDescription>Assigned seats by table (plus-ones and children count as seats)</CardDescription>
        </CardHeader>
        <CardContent>
          {data.seatingSummary.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No tables configured yet</div>
          ) : (
            <div className="space-y-2">
              {data.seatingSummary.map((table) => (
                <div key={table.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <div className="font-medium">{table.name || `Table ${table.tableNumber}`}</div>
                    <div className="text-sm text-muted-foreground">
                      Table {table.tableNumber} •{' '}
                      {table.assignedSeats}/{table.capacity} seats assigned
                    </div>
                  </div>
                  <Badge variant={table.isFull ? 'destructive' : 'outline'}>
                    {table.isFull ? 'Full' : `${table.availableSeats} open`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download reports as CSV files to share with your venue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                Meal totals by course type plus a table-by-table seating breakdown for food service
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
          <CardTitle>RSVP Reminder Campaign</CardTitle>
          <CardDescription>
            Send reminder emails only to pending invites (already sent, not yet responded).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSendReminderCampaign}
            disabled={sendingReminderCampaign}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {sendingReminderCampaign ? 'Sending...' : 'Send RSVP Reminders'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Thank-You Campaign</CardTitle>
          <CardDescription>
            Send thank-you emails to attending invites, skipping invites already thanked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSendThankYouCampaign}
            disabled={sendingThankYouCampaign}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {sendingThankYouCampaign ? 'Sending...' : 'Send Thank-You Emails'}
          </Button>
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
            className="w-full sm:w-auto"
          >
            {sendingPhotoCampaign ? 'Sending...' : 'Send Photo Share Emails'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
