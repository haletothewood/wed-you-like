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
  isPlusOne: boolean
  isChild: boolean
  parentGuestId?: string
  isInviteLead: boolean
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
  rsvpStatus: {
    hasResponded: boolean
    isAttending: boolean | null
    adultsAttending: number | null
    childrenAttending: number | null
    respondedAt: string | null
  }
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
  const [groupGuests, setGroupGuests] = useState<
    Array<{
      id: string
      name: string
      email: string
      isChild: boolean
      parentGuestId?: string
      isInviteLead: boolean
    }>
  >([
    { id: crypto.randomUUID(), name: '', email: '', isChild: false, isInviteLead: true },
    { id: crypto.randomUUID(), name: '', email: '', isChild: false, isInviteLead: false },
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
          guests: groupGuests,
        }),
      })

      if (response.ok) {
        setGroupName('')
        setGroupGuests([
          { id: crypto.randomUUID(), name: '', email: '', isChild: false, isInviteLead: true },
          { id: crypto.randomUUID(), name: '', email: '', isChild: false, isInviteLead: false },
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

  const updateGroupGuest = (
    index: number,
    field: 'name' | 'email' | 'parentGuestId',
    value: string
  ) => {
    const updated = [...groupGuests]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setGroupGuests(updated)
  }

  const addAdultGuest = () => {
    setGroupGuests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        email: '',
        isChild: false,
        isInviteLead: prev.every((g) => !g.isInviteLead),
      },
    ])
  }

  const addChildGuest = () => {
    const eligibleParents = groupGuests.filter((g) => !g.isChild && !g.isInviteLead)
    setGroupGuests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        email: '',
        isChild: true,
        parentGuestId: eligibleParents[0]?.id,
        isInviteLead: false,
      },
    ])
  }

  const removeGroupGuest = (id: string) => {
    setGroupGuests((prev) => {
      const filtered = prev.filter((g) => g.id !== id && g.parentGuestId !== id)
      if (!filtered.some((g) => g.isInviteLead)) {
        const firstAdultIdx = filtered.findIndex((g) => !g.isChild)
        if (firstAdultIdx >= 0) {
          filtered[firstAdultIdx] = { ...filtered[firstAdultIdx], isInviteLead: true }
        }
      }
      return filtered
    })
  }

  const toggleGuestType = (id: string, isChild: boolean) => {
    setGroupGuests((prev) => {
      const eligibleParents = prev.filter((g) => g.id !== id && !g.isChild && !g.isInviteLead)
      return prev.map((guest) => {
        if (guest.id !== id) {
          return guest.parentGuestId === id ? { ...guest, parentGuestId: undefined } : guest
        }

        return {
          ...guest,
          isChild,
          parentGuestId: isChild ? guest.parentGuestId || eligibleParents[0]?.id : undefined,
          isInviteLead: isChild ? false : guest.isInviteLead,
        }
      })
    })
  }

  const setInviteLead = (id: string) => {
    setGroupGuests((prev) =>
      prev.map((guest) => {
        if (guest.isChild) return { ...guest, isInviteLead: false }
        return { ...guest, isInviteLead: guest.id === id }
      })
    )
  }

  if (loading) {
    return <LoadingSpinner text="Loading invites..." />
  }

  return (
    <div className="p-4 md:p-8">
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
                  <Label htmlFor="groupName">
                    Group Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., The Smith Family"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={addAdultGuest}>
                    Add Adult
                  </Button>
                  <Button type="button" variant="outline" onClick={addChildGuest}>
                    Add Child
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Guest Details</Label>
                  <p className="text-xs text-muted-foreground">
                    Children must be linked to an adult who is not the invite lead.
                  </p>
                  {groupGuests.map((guest, idx) => (
                    <div key={guest.id} className="rounded-md border p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={guest.isChild ? 'secondary' : 'outline'}>
                          {guest.isChild ? 'Child' : 'Adult'}
                        </Badge>
                        {!guest.isChild && guest.isInviteLead && (
                          <Badge>Invite Lead</Badge>
                        )}
                        <Button
                          type="button"
                          variant={guest.isChild ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={() => toggleGuestType(guest.id, true)}
                        >
                          Set Child
                        </Button>
                        <Button
                          type="button"
                          variant={!guest.isChild ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={() => toggleGuestType(guest.id, false)}
                        >
                          Set Adult
                        </Button>
                        {!guest.isChild && (
                          <Button
                            type="button"
                            variant={guest.isInviteLead ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setInviteLead(guest.id)}
                          >
                            Mark Invite Lead
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeGroupGuest(guest.id)}
                          disabled={groupGuests.length <= 2}
                          className="ml-auto"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder={`Guest ${idx + 1} Name`}
                          value={guest.name}
                          onChange={(e) => updateGroupGuest(idx, 'name', e.target.value)}
                          required
                        />
                        <Input
                          type="email"
                          placeholder={`Guest ${idx + 1} Email`}
                          value={guest.email}
                          onChange={(e) => updateGroupGuest(idx, 'email', e.target.value)}
                        />
                      </div>

                      {guest.isChild && (
                        <div className="space-y-1">
                          <Label className="text-xs">Parent Guest</Label>
                          <select
                            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                            value={guest.parentGuestId || ''}
                            onChange={(e) => updateGroupGuest(idx, 'parentGuestId', e.target.value)}
                          >
                            <option value="">Select parent</option>
                            {groupGuests
                              .filter((g) => !g.isChild && !g.isInviteLead && g.id !== guest.id)
                              .map((parent) => (
                                <option key={parent.id} value={parent.id}>
                                  {parent.name || 'Unnamed adult'}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
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
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name/Group</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>RSVP Response</TableHead>
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
                      <div className="text-sm space-y-1">
                        {invite.guests.map((g) => (
                          <div key={g.id} className="flex items-center gap-2">
                            <span>{g.name}</span>
                            {g.isChild && <Badge variant="secondary" className="text-[10px]">Child</Badge>}
                            {!g.isChild && g.isInviteLead && (
                              <Badge variant="outline" className="text-[10px]">Lead</Badge>
                            )}
                            {g.isPlusOne && (
                              <Badge variant="secondary" className="text-[10px]">Plus-one</Badge>
                            )}
                          </div>
                        ))}
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
                      {invite.rsvpStatus.hasResponded ? (
                        <div className="space-y-1">
                          <Badge
                            className={
                              invite.rsvpStatus.isAttending
                                ? 'bg-success text-success-foreground'
                                : 'bg-destructive text-destructive-foreground'
                            }
                          >
                            {invite.rsvpStatus.isAttending
                              ? '✓ Attending'
                              : '✗ Not Attending'}
                          </Badge>
                          {invite.rsvpStatus.isAttending && (
                            <div className="text-xs text-muted-foreground">
                              {invite.rsvpStatus.adultsAttending}A{' '}
                              {invite.rsvpStatus.childrenAttending}C
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No Response</Badge>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
