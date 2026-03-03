'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LockKeyhole } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Sign-in failed')
        setLoading(false)
        return
      }

      router.push('/admin')
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="hero-wash surface-grid min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-sm items-center">
        <Card className="surface-panel w-full">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto rounded-full border border-primary/25 bg-primary/10 p-3 text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle className="text-3xl font-semibold">Wed You Like</CardTitle>
            <CardDescription className="text-sm sm:text-base">Admin sign-in</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Email or username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
