'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Admin() {
  const features = [
    {
      href: '/admin/invites' as const,
      icon: '✉️',
      title: 'Invites',
      description: 'Create and manage guest invitations with unique RSVP links',
      enabled: true,
    },
    {
      href: '/admin/meal-options' as const,
      icon: '🍽️',
      title: 'Meal Options',
      description: 'Configure menu options for starters, mains, and desserts',
      enabled: true,
    },
    {
      href: '/admin/custom-questions' as const,
      icon: '❓',
      title: 'Custom Questions',
      description: 'Add custom questions for guests (text, single choice, multiple choice)',
      enabled: true,
    },
    {
      href: '/admin/email-templates' as const,
      icon: '📧',
      title: 'Email Templates',
      description: 'Manage and configure email invitation templates',
      enabled: true,
    },
    {
      href: '/admin/wedding-settings' as const,
      icon: '⚙️',
      title: 'Wedding Settings',
      description: 'Configure your wedding details, date, time, and venue',
      enabled: true,
    },
    {
      href: '/admin' as const,
      icon: '🪑',
      title: 'Table Assignments',
      description: 'Coming soon: Assign guests to tables',
      enabled: false,
    },
  ] as const

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description="Welcome to your wedding RSVP management system"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          feature.enabled ? (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary cursor-pointer">
                <CardHeader>
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ) : (
            <Card key={feature.href} className="h-full opacity-60">
              <CardHeader>
                <div className="text-4xl mb-3">{feature.icon}</div>
                <CardTitle className="text-muted-foreground">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        ))}
      </div>

      <Card className="mt-6 bg-muted/50 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
          <CardDescription>
            View all your invites and RSVPs in the Invites section
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
