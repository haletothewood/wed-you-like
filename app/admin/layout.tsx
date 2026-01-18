'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          background: '#2c3e50',
          color: 'white',
          padding: '2rem 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Wedding Admin</h2>
        </div>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem 1.5rem',
                      color: 'white',
                      textDecoration: 'none',
                      background: isActive ? '#34495e' : 'transparent',
                      borderLeft: isActive ? '4px solid #3498db' : '4px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#34495e'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '1.5rem',
            right: '1.5rem',
          }}
        >
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loggingOut ? '#95a5a6' : '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) {
                e.currentTarget.style.backgroundColor = '#c0392b'
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingOut) {
                e.currentTarget.style.backgroundColor = '#e74c3c'
              }
            }}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, background: '#ecf0f1' }}>
        <div
          style={{
            background: 'white',
            borderBottom: '1px solid #ddd',
            padding: '1.5rem 2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#2c3e50' }}>
              {navItems.find(item => item.href === pathname)?.label || 'Admin'}
            </h1>
            <div style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>
              Wedding RSVP System
            </div>
          </div>
        </div>
        <div style={{ padding: '2rem' }}>{children}</div>
      </main>
    </div>
  )
}
