'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Guest {
  id: string
  name: string
  email: string
}

interface Invite {
  id: string
  token: string
  groupName: string | null
  adultsCount: number
  childrenCount: number
  plusOneAllowed: boolean
  guests: Guest[]
  sentAt: string | null
  createdAt: string
}

export default function InvitesAdmin() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [inviteType, setInviteType] = useState<'individual' | 'group'>('individual')
  const [sending, setSending] = useState<string | null>(null)

  // Individual form state
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [plusOneAllowed, setPlusOneAllowed] = useState(false)

  // Group form state
  const [groupName, setGroupName] = useState('')
  const [adultsCount, setAdultsCount] = useState(2)
  const [childrenCount, setChildrenCount] = useState(0)
  const [groupGuests, setGroupGuests] = useState<Array<{ name: string; email: string }>>([
    { name: '', email: '' },
    { name: '', email: '' },
  ])

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/admin/invites')
      const data = await response.json()
      setInvites(data.invites || [])
    } catch (error) {
      console.error('Error fetching invites:', error)
      setInvites([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIndividual = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'individual',
          guestName,
          email,
          plusOneAllowed,
        }),
      })

      if (response.ok) {
        setGuestName('')
        setEmail('')
        setPlusOneAllowed(false)
        setShowForm(false)
        fetchInvites()
      }
    } catch (error) {
      console.error('Error creating invite:', error)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          groupName,
          adultsCount,
          childrenCount,
          guests: groupGuests,
        }),
      })

      if (response.ok) {
        setGroupName('')
        setAdultsCount(2)
        setChildrenCount(0)
        setGroupGuests([
          { name: '', email: '' },
          { name: '', email: '' },
        ])
        setShowForm(false)
        fetchInvites()
      }
    } catch (error) {
      console.error('Error creating group invite:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) return

    try {
      const response = await fetch(`/api/admin/invites/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchInvites()
      }
    } catch (error) {
      console.error('Error deleting invite:', error)
    }
  }

  const handleSendEmail = async (id: string) => {
    setSending(id)
    try {
      const response = await fetch(`/api/admin/invites/${id}/send-email`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Email sent successfully to ${data.sentTo}`)
        fetchInvites()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSending(null)
    }
  }

  const updateGroupGuestCount = (newAdults: number, newChildren: number) => {
    const totalCount = newAdults + newChildren
    const currentCount = groupGuests.length

    if (totalCount > currentCount) {
      const newGuests = Array(totalCount - currentCount)
        .fill(null)
        .map(() => ({ name: '', email: '' }))
      setGroupGuests([...groupGuests, ...newGuests])
    } else if (totalCount < currentCount) {
      setGroupGuests(groupGuests.slice(0, totalCount))
    }
  }

  const updateGroupGuest = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...groupGuests]
    updated[index][field] = value
    setGroupGuests(updated)
  }

  if (loading) {
    return <LoadingSpinner text="Loading invites..." />
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Invite Management"
        description="Create and manage wedding invitations"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Invite'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Invite</CardTitle>
            <CardDescription>
              Send invitations to individual guests or groups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button
                variant={inviteType === 'individual' ? 'default' : 'outline'}
                onClick={() => setInviteType('individual')}
              >
                Individual
              </Button>
              <Button
                variant={inviteType === 'group' ? 'default' : 'outline'}
                onClick={() => setInviteType('group')}
              >
                Group
              </Button>
            </div>

            <Separator />

            {inviteType === 'individual' ? (
              <form onSubmit={handleCreateIndividual} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">
                    Guest Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="plusOne"
                    checked={plusOneAllowed}
                    onCheckedChange={(checked) => setPlusOneAllowed(checked as boolean)}
                  />
                  <Label htmlFor="plusOne" className="font-normal cursor-pointer">
                    Allow Plus One
                  </Label>
                </div>

                <Button type="submit">Create Individual Invite</Button>
              </form>
            ) : (
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., The Smith Family"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">
                      Adults <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      value={adultsCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        setAdultsCount(val)
                        updateGroupGuestCount(val, childrenCount)
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="children">Children</Label>
                    <Input
                      id="children"
                      type="number"
                      min="0"
                      value={childrenCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        setChildrenCount(val)
                        updateGroupGuestCount(adultsCount, val)
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Guest Details</Label>
                  {groupGuests.map((guest, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder={`Guest ${idx + 1} Name`}
                        value={guest.name}
                        onChange={(e) => updateGroupGuest(idx, 'name', e.target.value)}
                      />
                      <Input
                        type="email"
                        placeholder={`Guest ${idx + 1} Email`}
                        value={guest.email}
                        onChange={(e) => updateGroupGuest(idx, 'email', e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <Button type="submit">Create Group Invite</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {invites.length === 0 ? (
        <EmptyState
          title="No invites created yet"
          description="Click 'Create Invite' to send your first invitation"
          action={
            <Button onClick={() => setShowForm(true)}>Create First Invite</Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Invites ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name/Group</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>RSVP Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.groupName || invite.guests[0]?.name || 'Unknown'}
                      {invite.plusOneAllowed && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          +1
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {invite.guests.map((g) => g.name).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {invite.adultsCount}A {invite.childrenCount}C
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invite.sentAt ? (
                        <Badge className="bg-success text-success-foreground">
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Sent</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        /rsvp/{invite.token}
                      </code>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={sending === invite.id}
                        onClick={() => handleSendEmail(invite.id)}
                      >
                        {sending === invite.id ? 'Sending...' : 'Send Email'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(invite.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
