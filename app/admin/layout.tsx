'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LayoutGrid,
  Settings,
  Mail,
  FileText,
  UtensilsCrossed,
  CircleHelp,
  Armchair,
  ChartNoAxesColumn,
  Menu,
  X,
  LogOut,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopNavExpanded, setDesktopNavExpanded] = useState(false)

  useEffect(() => {
    const savedState = window.localStorage.getItem('admin-nav-expanded')
    if (savedState === 'true') {
      setDesktopNavExpanded(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('admin-nav-expanded', String(desktopNavExpanded))
  }, [desktopNavExpanded])

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
    { href: '/admin' as const, label: 'Dashboard', icon: LayoutGrid },
    { href: '/admin/wedding-settings' as const, label: 'Event Details', icon: Settings },
    { href: '/admin/invites' as const, label: 'Invitations', icon: Mail },
    { href: '/admin/email-templates' as const, label: 'Email Templates', icon: FileText },
    { href: '/admin/meal-options' as const, label: 'Menu Options', icon: UtensilsCrossed },
    { href: '/admin/custom-questions' as const, label: 'Guest Questions', icon: CircleHelp },
    { href: '/admin/tables' as const, label: 'Table Plan', icon: Armchair },
    { href: '/admin/reports' as const, label: 'Reports', icon: ChartNoAxesColumn },
  ]

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="hero-wash surface-grid flex min-h-screen overflow-hidden md:h-screen">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-md md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Hidden on mobile, slides in when menu open */}
      <aside className={cn(
        "glass-toolbar w-[16rem] max-w-[85vw] md:max-w-none text-foreground sticky top-0 h-screen flex flex-col z-50",
        "fixed md:static transition-all duration-300 ease-out",
        desktopNavExpanded ? "md:w-[16rem]" : "md:w-[4.75rem]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className={cn("p-4 flex items-center justify-between", desktopNavExpanded && "sm:p-5")}>
          <div className={cn(!desktopNavExpanded && "md:hidden")}>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Control</p>
            <h2 className="text-xl font-semibold">Wed You Like</h2>
          </div>
          <button
            onClick={() => setDesktopNavExpanded((current) => !current)}
            className="hidden md:inline-flex rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
            aria-label={desktopNavExpanded ? 'Collapse navigation' : 'Expand navigation'}
            title={desktopNavExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            {desktopNavExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          {/* Close button for mobile */}
          <button
            onClick={closeMobileMenu}
            className="md:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Separator className="bg-border/60" />

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    title={!desktopNavExpanded ? item.label : undefined}
                    className={cn(
                      'mx-3 flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all',
                      'border border-transparent hover:border-border/70 hover:bg-card/55',
                      !desktopNavExpanded && 'md:justify-center md:px-2',
                      isActive
                        ? 'bg-primary/10 border-primary/25 font-semibold text-primary'
                        : ''
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className={cn(!desktopNavExpanded && 'md:hidden')}>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className={cn("p-4", desktopNavExpanded && "sm:p-5")}>
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline"
            title={desktopNavExpanded ? undefined : 'Sign out'}
            className={cn(
              "w-full justify-start",
              !desktopNavExpanded && "md:h-10 md:w-10 md:p-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(!desktopNavExpanded && 'md:hidden')}>
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen overflow-y-auto md:h-screen">
        <div className="sticky top-0 z-10 border-b border-border/60 bg-card/75 backdrop-blur-xl md:hidden">
          <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              {/* Hamburger Menu Button - Only on Mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden rounded-lg border border-border/70 bg-card/70 p-2 text-foreground backdrop-blur-xl hover:bg-card"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-[calc(100vh-4rem)] md:min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
