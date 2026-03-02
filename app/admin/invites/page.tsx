'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BULK_TEMPLATE_CSV, parseBulkInviteInput } from './bulkInvites'

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
    rsvpId: string | null
    isAttending: boolean | null
    adultsAttending: number | null
    childrenAttending: number | null
    respondedAt: string | null
  }
  completeness: {
    needsFollowUp: boolean
    expectedMealSelections: number
    actualMealSelections: number
    missingMealSelections: number
    expectedRequiredAnswers: number
    actualRequiredAnswers: number
    missingRequiredAnswers: number
    isComplete: boolean
  }
}

export default function InvitesAdmin() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [inviteType, setInviteType] = useState<'individual' | 'group' | 'bulk'>('individual')
  const [sending, setSending] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sentFilter, setSentFilter] = useState<'all' | 'sent' | 'not_sent'>('all')
  const [responseFilter, setResponseFilter] = useState<'all' | 'responded' | 'no_response'>('all')
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attending' | 'not_attending'>('all')
  const [inviteShapeFilter, setInviteShapeFilter] = useState<
    'all' | 'plus_one_allowed' | 'has_children'
  >('all')
  const [completenessFilter, setCompletenessFilter] = useState<
    'all' | 'needs_follow_up' | 'missing_meals' | 'missing_required_answers' | 'complete'
  >('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest')

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
  const [bulkInput, setBulkInput] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkLoadingFile, setBulkLoadingFile] = useState(false)
  const [bulkSummary, setBulkSummary] = useState<{
    created: number
    failed: number
    failures: Array<{ lineNumber: number; message: string }>
  } | null>(null)

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

  const parsedBulkRows = useMemo(() => parseBulkInviteInput(bulkInput), [bulkInput])
  const bulkValidRows = useMemo(
    () => parsedBulkRows.filter((row) => row.errors.length === 0),
    [parsedBulkRows]
  )
  const bulkInvalidRows = useMemo(
    () => parsedBulkRows.filter((row) => row.errors.length > 0),
    [parsedBulkRows]
  )

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkValidRows.length === 0 || bulkInvalidRows.length > 0) return

    setBulkSubmitting(true)
    setBulkSummary(null)
    const failures: Array<{ lineNumber: number; message: string }> = []
    let created = 0

    for (const row of bulkValidRows) {
      try {
        const response = await fetch('/api/admin/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'individual',
            guestName: row.guestName,
            email: row.email,
            plusOneAllowed: row.plusOneAllowed,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          failures.push({
            lineNumber: row.lineNumber,
            message: data.error || 'Failed to create invite',
          })
          continue
        }

        created++
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create invite'
        failures.push({ lineNumber: row.lineNumber, message })
      }
    }

    setBulkSummary({
      created,
      failed: failures.length,
      failures,
    })
    setBulkSubmitting(false)

    if (created > 0) {
      await fetchInvites()
    }
  }

  const handleDownloadBulkTemplate = () => {
    const blob = new Blob([BULK_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'invite-bulk-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleBulkFileUpload = async (file: File) => {
    setBulkLoadingFile(true)
    setBulkSummary(null)

    try {
      const text = await file.text()
      setBulkInput(text)
    } catch (error) {
      console.error('Failed to read bulk invite file:', error)
      alert('Failed to read file. Please upload a valid CSV or text file.')
    } finally {
      setBulkLoadingFile(false)
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

  const filteredInvites = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filtered = invites.filter((invite) => {
      if (normalizedQuery) {
        const guestNames = invite.guests.map((g) => g.name).join(' ')
        const guestEmails = invite.guests.map((g) => g.email).join(' ')
        const searchable = [
          invite.groupName || '',
          guestNames,
          guestEmails,
          invite.token,
        ]
          .join(' ')
          .toLowerCase()

        if (!searchable.includes(normalizedQuery)) {
          return false
        }
      }

      if (sentFilter === 'sent' && !invite.sentAt) return false
      if (sentFilter === 'not_sent' && invite.sentAt) return false

      if (responseFilter === 'responded' && !invite.rsvpStatus.hasResponded) return false
      if (responseFilter === 'no_response' && invite.rsvpStatus.hasResponded) return false

      if (
        attendanceFilter === 'attending' &&
        !(invite.rsvpStatus.hasResponded && invite.rsvpStatus.isAttending === true)
      ) {
        return false
      }

      if (
        attendanceFilter === 'not_attending' &&
        !(invite.rsvpStatus.hasResponded && invite.rsvpStatus.isAttending === false)
      ) {
        return false
      }

      if (inviteShapeFilter === 'plus_one_allowed' && !invite.plusOneAllowed) return false
      if (inviteShapeFilter === 'has_children' && invite.childrenCount <= 0) return false
      if (completenessFilter === 'needs_follow_up' && !invite.completeness.needsFollowUp) return false
      if (completenessFilter === 'missing_meals' && invite.completeness.missingMealSelections <= 0) return false
      if (
        completenessFilter === 'missing_required_answers' &&
        invite.completeness.missingRequiredAnswers <= 0
      ) {
        return false
      }
      if (completenessFilter === 'complete' && !invite.completeness.isComplete) return false

      return true
    })

    return filtered.sort((a, b) => {
      const nameA = (a.groupName || a.guests[0]?.name || '').toLowerCase()
      const nameB = (b.groupName || b.guests[0]?.name || '').toLowerCase()
      const createdA = new Date(a.createdAt).getTime()
      const createdB = new Date(b.createdAt).getTime()

      switch (sortBy) {
        case 'oldest':
          return createdA - createdB
        case 'name_asc':
          return nameA.localeCompare(nameB)
        case 'name_desc':
          return nameB.localeCompare(nameA)
        case 'newest':
        default:
          return createdB - createdA
      }
    })
  }, [
    invites,
    searchQuery,
    sentFilter,
    responseFilter,
    attendanceFilter,
    inviteShapeFilter,
    completenessFilter,
    sortBy,
  ])

  if (loading) {
    return <LoadingSpinner text="Loading invites..." />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Invite Management"
        description="Create and manage wedding invitations"
        action={
          <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
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
            <div className="flex flex-col gap-3 sm:flex-row">
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
              <Button
                variant={inviteType === 'bulk' ? 'default' : 'outline'}
                onClick={() => setInviteType('bulk')}
              >
                Bulk
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
            ) : inviteType === 'group' ? (
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
            ) : (
              <form onSubmit={handleCreateBulk} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-invites">
                    Paste bulk invites <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      id="bulk-file-upload"
                      type="file"
                      accept=".csv,text/csv,.txt,text/plain"
                      disabled={bulkLoadingFile || bulkSubmitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        void handleBulkFileUpload(file)
                        e.currentTarget.value = ''
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadBulkTemplate}
                      className="w-full sm:w-auto"
                    >
                      Download CSV Template
                    </Button>
                  </div>
                  {bulkLoadingFile && (
                    <p className="text-xs text-muted-foreground">Loading file...</p>
                  )}
                  <Textarea
                    id="bulk-invites"
                    value={bulkInput}
                    onChange={(e) => {
                      setBulkInput(e.target.value)
                      setBulkSummary(null)
                    }}
                    rows={10}
                    placeholder={`name,email,plusOneAllowed\nAlex Smith,alex@example.com,yes\nJamie Lee,jamie@example.com,no`}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: name, email, plusOneAllowed (optional). Accepted plus-one values: yes/no, true/false, 1/0.
                  </p>
                </div>

                {parsedBulkRows.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Rows: {parsedBulkRows.length}</Badge>
                    <Badge className="bg-success text-success-foreground">
                      Valid: {bulkValidRows.length}
                    </Badge>
                    <Badge variant={bulkInvalidRows.length > 0 ? 'destructive' : 'outline'}>
                      Invalid: {bulkInvalidRows.length}
                    </Badge>
                  </div>
                )}

                {bulkInvalidRows.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <p className="mb-1 font-medium">Fix these rows before creating invites:</p>
                      <ul className="list-disc pl-5">
                        {bulkInvalidRows.slice(0, 8).map((row) => (
                          <li key={`invalid-${row.lineNumber}`}>
                            Line {row.lineNumber}: {row.errors.join(', ')}
                          </li>
                        ))}
                      </ul>
                      {bulkInvalidRows.length > 8 && (
                        <p className="mt-2 text-xs">
                          +{bulkInvalidRows.length - 8} more invalid rows
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {bulkSummary && (
                  <Alert variant={bulkSummary.failed > 0 ? 'destructive' : 'default'}>
                    <AlertDescription>
                      <p>
                        Created {bulkSummary.created} invite{bulkSummary.created === 1 ? '' : 's'}.
                        {bulkSummary.failed > 0 &&
                          ` ${bulkSummary.failed} failed.`}
                      </p>
                      {bulkSummary.failures.length > 0 && (
                        <ul className="list-disc pl-5 mt-2">
                          {bulkSummary.failures.slice(0, 8).map((failure, index) => (
                            <li key={`${failure.lineNumber}-${index}`}>
                              Line {failure.lineNumber}: {failure.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {bulkValidRows.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Line</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Plus One</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkValidRows.slice(0, 10).map((row) => (
                            <TableRow key={`preview-${row.lineNumber}`}>
                              <TableCell>{row.lineNumber}</TableCell>
                              <TableCell>{row.guestName}</TableCell>
                              <TableCell>{row.email}</TableCell>
                              <TableCell>{row.plusOneAllowed ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {bulkValidRows.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        Showing first 10 of {bulkValidRows.length} valid rows.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    bulkSubmitting || bulkValidRows.length === 0 || bulkInvalidRows.length > 0
                  }
                >
                  {bulkSubmitting
                    ? 'Creating invites...'
                    : `Create ${bulkValidRows.length} Invite${bulkValidRows.length === 1 ? '' : 's'}`}
                </Button>
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
            <CardTitle>
              All Invites ({filteredInvites.length}
              {filteredInvites.length !== invites.length ? ` of ${invites.length}` : ''})
            </CardTitle>
            <CardDescription>Search, filter, and sort invitations for faster admin work.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
              <div className="xl:col-span-2">
                <Label htmlFor="invite-search" className="text-xs">Search</Label>
                <Input
                  id="invite-search"
                  placeholder="Group, guest name, email, token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="sent-filter" className="text-xs">Email</Label>
                <select
                  id="sent-filter"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={sentFilter}
                  onChange={(e) => setSentFilter(e.target.value as typeof sentFilter)}
                >
                  <option value="all">All</option>
                  <option value="sent">Sent</option>
                  <option value="not_sent">Not sent</option>
                </select>
              </div>

              <div>
                <Label htmlFor="response-filter" className="text-xs">RSVP</Label>
                <select
                  id="response-filter"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value as typeof responseFilter)}
                >
                  <option value="all">All</option>
                  <option value="responded">Responded</option>
                  <option value="no_response">No response</option>
                </select>
              </div>

              <div>
                <Label htmlFor="attendance-filter" className="text-xs">Attendance</Label>
                <select
                  id="attendance-filter"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value as typeof attendanceFilter)}
                >
                  <option value="all">All</option>
                  <option value="attending">Attending</option>
                  <option value="not_attending">Not attending</option>
                </select>
              </div>

              <div>
                <Label htmlFor="shape-filter" className="text-xs">Type</Label>
                <select
                  id="shape-filter"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={inviteShapeFilter}
                  onChange={(e) => setInviteShapeFilter(e.target.value as typeof inviteShapeFilter)}
                >
                  <option value="all">All</option>
                  <option value="plus_one_allowed">Plus one allowed</option>
                  <option value="has_children">Includes children</option>
                </select>
              </div>

              <div>
                <Label htmlFor="completeness-filter" className="text-xs">Completeness</Label>
                <select
                  id="completeness-filter"
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={completenessFilter}
                  onChange={(e) => setCompletenessFilter(e.target.value as typeof completenessFilter)}
                >
                  <option value="all">All</option>
                  <option value="needs_follow_up">Needs follow-up</option>
                  <option value="missing_meals">Missing meal choices</option>
                  <option value="missing_required_answers">Missing required answers</option>
                  <option value="complete">Complete RSVP data</option>
                </select>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-3 items-end">
              <div>
                <Label htmlFor="sort-by" className="text-xs">Sort</Label>
                <select
                  id="sort-by"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSentFilter('all')
                  setResponseFilter('all')
                  setAttendanceFilter('all')
                  setInviteShapeFilter('all')
                  setCompletenessFilter('all')
                  setSortBy('newest')
                }}
              >
                Reset Filters
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name/Group</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>RSVP Response</TableHead>
                  <TableHead>Attending</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>RSVP Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvites.map((invite) => (
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
                      {invite.rsvpStatus.hasResponded ? (
                        <Badge variant="outline">
                          {(invite.rsvpStatus.adultsAttending ?? 0) + (invite.rsvpStatus.childrenAttending ?? 0)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {invite.completeness.needsFollowUp ? (
                          <Badge variant="secondary">Needs follow-up</Badge>
                        ) : invite.completeness.isComplete ? (
                          <Badge className="bg-success text-success-foreground">Complete</Badge>
                        ) : (
                          <Badge variant="outline">Partial</Badge>
                        )}
                        {invite.completeness.missingMealSelections > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Meals missing: {invite.completeness.missingMealSelections}
                          </div>
                        )}
                        {invite.completeness.missingRequiredAnswers > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Required answers missing: {invite.completeness.missingRequiredAnswers}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        /rsvp/{invite.token}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredInvites.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No invites match the current filters.
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
