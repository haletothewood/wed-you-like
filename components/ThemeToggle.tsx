'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark'

const storageKey = 'theme'

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    return
  }
  root.classList.remove('dark')
}

export function ThemeToggle() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<Theme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved)
      applyTheme(saved)
      setReady(true)
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const nextTheme: Theme = prefersDark ? 'dark' : 'light'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(storageKey, nextTheme)
    setReady(true)
  }, [])

  const handleToggle = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(storageKey, nextTheme)
  }

  const isVisible = pathname === '/' || pathname.startsWith('/admin')
  if (!isVisible) {
    return null
  }

  if (!ready) {
    return null
  }

  const isDark = theme === 'dark'
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="fixed bottom-4 right-4 z-50 border-border/70 bg-card/90 backdrop-blur md:bottom-6 md:right-6"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
