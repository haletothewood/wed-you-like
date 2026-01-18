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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Hidden on mobile, slides in when menu open */}
      <aside className={cn(
        "w-64 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground sticky top-0 h-screen flex flex-col z-50",
        "fixed md:static transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Wedding Admin</h2>
          {/* Close button for mobile */}
          <button
            onClick={closeMobileMenu}
            className="md:hidden text-2xl hover:bg-primary-foreground/10 rounded p-1"
          >
            ×
          </button>
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
                    onClick={closeMobileMenu}
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
      <main className="flex-1 w-full">
        <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button - Only on Mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-2xl text-foreground p-2 hover:bg-muted rounded"
                aria-label="Open menu"
              >
                ☰
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {navItems.find(item => item.href === pathname)?.label || 'Admin'}
              </h1>
            </div>
            <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              Wedding RSVP System
            </div>
          </div>
        </div>
        <div className="bg-background min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>
    </div>
  )
}
