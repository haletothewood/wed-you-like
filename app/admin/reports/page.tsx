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
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

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
    </div>
  )
}
