'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Mail,
  UtensilsCrossed,
  CircleHelp,
  FileText,
  Settings,
  Armchair,
  ArrowRight,
} from 'lucide-react'

interface QuickStats {
  totalInvites: number
  totalRsvps: number
  attending: number
  totalGuestsAttending: number
}

export default function Admin() {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/reports')
        const data = await response.json()
        setStats({
          totalInvites: data.overview.totalInvites,
          totalRsvps: data.overview.totalRsvps,
          attending: data.overview.attending,
          totalGuestsAttending: data.overview.totalGuestsAttending,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])
  const features = [
    {
      href: '/admin/invites' as const,
      icon: Mail,
      title: 'Invitations',
      description: 'Create and manage guest invites with unique RSVP links',
      enabled: true,
    },
    {
      href: '/admin/meal-options' as const,
      icon: UtensilsCrossed,
      title: 'Menu Options',
      description: 'Configure menu options for starters, mains, and desserts',
      enabled: true,
    },
    {
      href: '/admin/custom-questions' as const,
      icon: CircleHelp,
      title: 'Guest Questions',
      description: 'Add custom questions for guests (text, single choice, multiple choice)',
      enabled: true,
    },
    {
      href: '/admin/email-templates' as const,
      icon: FileText,
      title: 'Email Templates',
      description: 'Manage and configure email invitation templates',
      enabled: true,
    },
    {
      href: '/admin/wedding-settings' as const,
      icon: Settings,
      title: 'Event Details',
      description: 'Configure your wedding details, date, time, and venue',
      enabled: true,
    },
    {
      href: '/admin/tables' as const,
      icon: Armchair,
      title: 'Table Plan',
      description: 'Assign guests to tables with live capacity tracking',
      enabled: true,
    },
  ] as const

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Everything you need to run invites, RSVPs, and guest logistics."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {features.map((feature) => (
          feature.enabled ? (
            <Link key={feature.href} href={feature.href}>
              <Card className="surface-panel h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-3 inline-flex w-fit rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ) : (
            <Card key={feature.href} className="h-full opacity-60">
              <CardHeader>
                <feature.icon className="mb-3 h-5 w-5" />
                <CardTitle className="text-muted-foreground">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        ))}
      </div>

      <Card className="surface-panel mt-6">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Live Snapshot</CardTitle>
              <CardDescription>
                Current RSVP progress at a glance.
              </CardDescription>
            </div>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Open reports
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-4">Loading stats...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary sm:text-3xl">{stats.totalInvites}</div>
                <div className="text-sm text-muted-foreground mt-1">Invites sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary sm:text-3xl">{stats.totalRsvps}</div>
                <div className="text-sm text-muted-foreground mt-1">Responses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success sm:text-3xl">{stats.attending}</div>
                <div className="text-sm text-muted-foreground mt-1">Attending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success sm:text-3xl">{stats.totalGuestsAttending}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Guests</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">Failed to load stats</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
