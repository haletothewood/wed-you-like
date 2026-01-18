'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  const navItems = [
    { href: '/admin' as const, label: 'Dashboard', icon: '🏠' },
    { href: '/admin/wedding-settings' as const, label: 'Wedding Settings', icon: '💍' },
    { href: '/admin/invites' as const, label: 'Invites', icon: '✉️' },
    { href: '/admin/email-templates' as const, label: 'Email Templates', icon: '📧' },
    { href: '/admin/meal-options' as const, label: 'Meal Options', icon: '🍽️' },
    { href: '/admin/custom-questions' as const, label: 'Questions', icon: '❓' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground sticky top-0 h-screen flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Wedding Admin</h2>
        </div>

        <Separator className="bg-primary-foreground/20" />

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-6 py-3 transition-all',
                      'border-l-4 hover:bg-primary-foreground/10',
                      isActive
                        ? 'bg-primary-foreground/20 border-accent font-semibold'
                        : 'border-transparent'
                    )}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-6">
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="destructive"
            className="w-full"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center px-8 py-6">
            <h1 className="text-2xl font-bold text-foreground">
              {navItems.find(item => item.href === pathname)?.label || 'Admin'}
            </h1>
            <div className="text-sm text-muted-foreground">
              Wedding RSVP System
            </div>
          </div>
        </div>
        <div className="bg-background min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>
    </div>
  )
}
