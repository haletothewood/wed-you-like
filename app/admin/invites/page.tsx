'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type InviteType = 'individual' | 'group'
type SentFilter = 'all' | 'sent' | 'not_sent'
type ResponseFilter = 'all' | 'responded' | 'no_response'
type AttendanceFilter = 'all' | 'attending' | 'not_attending'
type InviteShapeFilter = 'all' | 'plus_one_allowed' | 'has_children'
type SortBy = 'newest' | 'oldest' | 'name_asc' | 'name_desc'

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

interface GroupGuestDraft {
  id: string
  name: string
  email: string
  isChild: boolean
  parentGuestId?: string
  isInviteLead: boolean
}

type Notice = {
  variant: 'default' | 'destructive'
  message: string
}

type ConfirmState =
  | {
      type: 'delete'
      inviteId: string
      inviteLabel: string
    }
  | {
      type: 'reminders'
      inviteIds: string[]
    }
  | null

const initialGroupGuests = (): GroupGuestDraft[] => [
  { id: crypto.randomUUID(), name: '', email: '', isChild: false, isInviteLead: true },
  { id: crypto.randomUUID(), name: '', email: '', isChild: false, isInviteLead: false },
]

const getInviteDisplayName = (invite: Invite): string => invite.groupName || invite.guests[0]?.name || 'Unknown'

const escapeCsvValue = (value: string): string => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json()
    if (payload?.error && typeof payload.error === 'string') {
      return payload.error
    }
  } catch {
    // Ignore non-JSON error payloads.
  }
  return fallback
}

function InviteFilters({
  searchQuery,
  setSearchQuery,
  sentFilter,
  setSentFilter,
  responseFilter,
  setResponseFilter,
  attendanceFilter,
  setAttendanceFilter,
  inviteShapeFilter,
  setInviteShapeFilter,
  sortBy,
  setSortBy,
  onReset,
}: {
  searchQuery: string
  setSearchQuery: (value: string) => void
  sentFilter: SentFilter
  setSentFilter: (value: SentFilter) => void
  responseFilter: ResponseFilter
  setResponseFilter: (value: ResponseFilter) => void
  attendanceFilter: AttendanceFilter
  setAttendanceFilter: (value: AttendanceFilter) => void
  inviteShapeFilter: InviteShapeFilter
  setInviteShapeFilter: (value: InviteShapeFilter) => void
  sortBy: SortBy
  setSortBy: (value: SortBy) => void
  onReset: () => void
}) {
  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <Label htmlFor="invite-search" className="text-xs">
            Search
          </Label>
          <Input
            id="invite-search"
            placeholder="Group, guest name, email, token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="sent-filter" className="text-xs">
            Email
          </Label>
          <select
            id="sent-filter"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={sentFilter}
            onChange={(e) => setSentFilter(e.target.value as SentFilter)}
          >
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="not_sent">Not sent</option>
          </select>
        </div>

        <div>
          <Label htmlFor="response-filter" className="text-xs">
            RSVP
          </Label>
          <select
            id="response-filter"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={responseFilter}
            onChange={(e) => setResponseFilter(e.target.value as ResponseFilter)}
          >
            <option value="all">All</option>
            <option value="responded">Responded</option>
            <option value="no_response">No response</option>
          </select>
        </div>

        <div>
          <Label htmlFor="attendance-filter" className="text-xs">
            Attendance
          </Label>
          <select
            id="attendance-filter"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value as AttendanceFilter)}
          >
            <option value="all">All</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not attending</option>
          </select>
        </div>

        <div>
          <Label htmlFor="shape-filter" className="text-xs">
            Type
          </Label>
          <select
            id="shape-filter"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={inviteShapeFilter}
            onChange={(e) => setInviteShapeFilter(e.target.value as InviteShapeFilter)}
          >
            <option value="all">All</option>
            <option value="plus_one_allowed">Plus one allowed</option>
            <option value="has_children">Includes children</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="sort-by" className="text-xs">
            Sort
          </Label>
          <select
            id="sort-by"
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>
        <Button type="button" variant="outline" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </>
  )
}

function BulkActions({
  filteredInvites,
  selectedInviteIds,
  reminderEligibleCount,
  selectedFilteredCount,
  onToggleSelectAllFiltered,
  onSendReminders,
  onExportCsv,
  bulkSending,
}: {
  filteredInvites: Invite[]
  selectedInviteIds: string[]
  reminderEligibleCount: number
  selectedFilteredCount: number
  onToggleSelectAllFiltered: () => void
  onSendReminders: () => void
  onExportCsv: () => void
  bulkSending: boolean
}) {
  const allFilteredSelected =
    filteredInvites.length > 0 &&
    filteredInvites.every((invite) => selectedInviteIds.includes(invite.id))

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onToggleSelectAllFiltered}
        disabled={filteredInvites.length === 0}
      >
        {allFilteredSelected ? 'Clear Filtered Selection' : 'Select All Filtered'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onSendReminders}
        disabled={bulkSending || reminderEligibleCount === 0}
      >
        {bulkSending ? 'Sending Reminders...' : `Send Reminders (${reminderEligibleCount})`}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onExportCsv}
        disabled={selectedInviteIds.length === 0}
      >
        Export Selected CSV ({selectedInviteIds.length})
      </Button>
      <span className="text-xs text-muted-foreground">Selected in current view: {selectedFilteredCount}</span>
    </div>
  )
}

function InvitesTable({
  filteredInvites,
  selectedInviteIds,
  sending,
  onToggleSelectAllFiltered,
  onToggleInviteSelection,
  onSendEmail,
  onDelete,
}: {
  filteredInvites: Invite[]
  selectedInviteIds: string[]
  sending: string | null
  onToggleSelectAllFiltered: () => void
  onToggleInviteSelection: (inviteId: string) => void
  onSendEmail: (inviteId: string) => void
  onDelete: (inviteId: string, inviteLabel: string) => void
}) {
  const allFilteredSelected =
    filteredInvites.length > 0 &&
    filteredInvites.every((invite) => selectedInviteIds.includes(invite.id))

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={onToggleSelectAllFiltered}
                aria-label="Select all filtered invites"
              />
            </TableHead>
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
          {filteredInvites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell>
                <Checkbox
                  checked={selectedInviteIds.includes(invite.id)}
                  onCheckedChange={() => onToggleInviteSelection(invite.id)}
                  aria-label={`Select invite ${getInviteDisplayName(invite)}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                {getInviteDisplayName(invite)}
                {invite.plusOneAllowed && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    +1
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {invite.guests.map((guest) => (
                    <div key={guest.id} className="flex items-center gap-2">
                      <span>{guest.name}</span>
                      {guest.isChild && (
                        <Badge variant="secondary" className="text-[10px]">
                          Child
                        </Badge>
                      )}
                      {!guest.isChild && guest.isInviteLead && (
                        <Badge variant="outline" className="text-[10px]">
                          Lead
                        </Badge>
                      )}
                      {guest.isPlusOne && (
                        <Badge variant="secondary" className="text-[10px]">
                          Plus-one
                        </Badge>
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
                  <Badge className="bg-success text-success-foreground">Sent</Badge>
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
                      {invite.rsvpStatus.isAttending ? '✓ Attending' : '✗ Not Attending'}
                    </Badge>
                    {invite.rsvpStatus.isAttending && (
                      <div className="text-xs text-muted-foreground">
                        {invite.rsvpStatus.adultsAttending}A {invite.rsvpStatus.childrenAttending}C
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">No Response</Badge>
                )}
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1 text-xs">/rsvp/{invite.token}</code>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={sending === invite.id}
                  onClick={() => onSendEmail(invite.id)}
                >
                  {sending === invite.id ? 'Sending...' : 'Send Email'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(invite.id, getInviteDisplayName(invite))}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredInvites.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No invites match the current filters.
        </div>
      )}
    </div>
  )
}

export default function InvitesAdmin() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [inviteType, setInviteType] = useState<InviteType>('individual')
  const [sending, setSending] = useState<string | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sentFilter, setSentFilter] = useState<SentFilter>('all')
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>('all')
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all')
  const [inviteShapeFilter, setInviteShapeFilter] = useState<InviteShapeFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])

  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [plusOneAllowed, setPlusOneAllowed] = useState(false)

  const [groupName, setGroupName] = useState('')
  const [groupGuests, setGroupGuests] = useState<GroupGuestDraft[]>(initialGroupGuests)

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
      setNotice({ variant: 'destructive', message: 'Failed to fetch invites.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const inviteIds = new Set(invites.map((invite) => invite.id))
    setSelectedInviteIds((prev) => prev.filter((inviteId) => inviteIds.has(inviteId)))
  }, [invites])

  const filteredInvites = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filtered = invites.filter((invite) => {
      if (normalizedQuery) {
        const guestNames = invite.guests.map((guest) => guest.name).join(' ')
        const guestEmails = invite.guests.map((guest) => guest.email).join(' ')
        const searchable = [invite.groupName || '', guestNames, guestEmails, invite.token]
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

      return true
    })

    return filtered.sort((a, b) => {
      const nameA = getInviteDisplayName(a).toLowerCase()
      const nameB = getInviteDisplayName(b).toLowerCase()
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
  }, [invites, searchQuery, sentFilter, responseFilter, attendanceFilter, inviteShapeFilter, sortBy])

  const filteredInviteIds = useMemo(
    () => new Set(filteredInvites.map((invite) => invite.id)),
    [filteredInvites]
  )

  const selectedInvites = useMemo(
    () => invites.filter((invite) => selectedInviteIds.includes(invite.id)),
    [invites, selectedInviteIds]
  )

  const selectedFilteredCount = useMemo(
    () => selectedInviteIds.filter((id) => filteredInviteIds.has(id)).length,
    [selectedInviteIds, filteredInviteIds]
  )

  const selectedReminderEligibleIds = useMemo(
    () =>
      selectedInvites
        .filter((invite) => !invite.rsvpStatus.hasResponded && Boolean(invite.sentAt))
        .map((invite) => invite.id),
    [selectedInvites]
  )

  const toggleInviteSelection = (inviteId: string) => {
    setSelectedInviteIds((prev) =>
      prev.includes(inviteId) ? prev.filter((id) => id !== inviteId) : [...prev, inviteId]
    )
  }

  const toggleSelectAllFiltered = () => {
    const allFilteredSelected =
      filteredInvites.length > 0 &&
      filteredInvites.every((invite) => selectedInviteIds.includes(invite.id))

    if (allFilteredSelected) {
      setSelectedInviteIds((prev) => prev.filter((id) => !filteredInviteIds.has(id)))
      return
    }

    setSelectedInviteIds((prev) => {
      const next = new Set(prev)
      for (const invite of filteredInvites) {
        next.add(invite.id)
      }
      return Array.from(next)
    })
  }

  const handleCreateIndividual = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)

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

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to create invite.')
        setNotice({ variant: 'destructive', message: errorMessage })
        return
      }

      setGuestName('')
      setEmail('')
      setPlusOneAllowed(false)
      setShowForm(false)
      await fetchInvites()
      setNotice({ variant: 'default', message: 'Individual invite created.' })
    } catch (error) {
      console.error('Error creating invite:', error)
      setNotice({ variant: 'destructive', message: 'Failed to create invite.' })
    }
  }

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)

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

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to create group invite.')
        setNotice({ variant: 'destructive', message: errorMessage })
        return
      }

      setGroupName('')
      setGroupGuests(initialGroupGuests())
      setShowForm(false)
      await fetchInvites()
      setNotice({ variant: 'default', message: 'Group invite created.' })
    } catch (error) {
      console.error('Error creating group invite:', error)
      setNotice({ variant: 'destructive', message: 'Failed to create group invite.' })
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    setNotice(null)

    try {
      const response = await fetch(`/api/admin/invites/${inviteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Failed to delete invite.')
        setNotice({ variant: 'destructive', message: errorMessage })
        return
      }

      await fetchInvites()
      setNotice({ variant: 'default', message: 'Invite deleted.' })
    } catch (error) {
      console.error('Error deleting invite:', error)
      setNotice({ variant: 'destructive', message: 'Failed to delete invite.' })
    }
  }

  const handleSendEmail = async (inviteId: string) => {
    setSending(inviteId)
    setNotice(null)

    try {
      const response = await fetch(`/api/admin/invites/${inviteId}/send-email`, {
        method: 'POST',
      })

      const errorMessage = await parseApiError(response, 'Failed to send email.')

      if (!response.ok) {
        setNotice({ variant: 'destructive', message: errorMessage })
        return
      }

      setNotice({ variant: 'default', message: 'Email sent successfully.' })
      await fetchInvites()
    } catch (error) {
      console.error('Error sending email:', error)
      setNotice({ variant: 'destructive', message: 'Failed to send email.' })
    } finally {
      setSending(null)
    }
  }

  const executeBulkReminderSend = async (inviteIds: string[]) => {
    setBulkSending(true)
    setNotice(null)

    let successCount = 0
    let failureCount = 0

    for (const inviteId of inviteIds) {
      try {
        const response = await fetch(`/api/admin/invites/${inviteId}/send-email`, {
          method: 'POST',
        })
        if (response.ok) {
          successCount++
        } else {
          failureCount++
        }
      } catch {
        failureCount++
      }
    }

    setBulkSending(false)
    await fetchInvites()

    if (failureCount > 0) {
      setNotice({
        variant: 'destructive',
        message: `Reminder send complete. Success: ${successCount}. Failed: ${failureCount}.`,
      })
      return
    }

    setNotice({
      variant: 'default',
      message: `Reminder send complete. Success: ${successCount}.`,
    })
  }

  const handleExportSelectedCsv = () => {
    if (selectedInvites.length === 0) {
      setNotice({ variant: 'destructive', message: 'Select at least one invite to export.' })
      return
    }

    const header = [
      'invite_id',
      'group_or_name',
      'primary_email',
      'adults_count',
      'children_count',
      'plus_one_allowed',
      'sent',
      'has_responded',
      'is_attending',
      'adults_attending',
      'children_attending',
    ]

    const rows = selectedInvites.map((invite) => {
      const primaryEmail = invite.guests.find((guest) => guest.email?.trim())?.email || ''
      return [
        invite.id,
        getInviteDisplayName(invite),
        primaryEmail,
        String(invite.adultsCount),
        String(invite.childrenCount),
        String(invite.plusOneAllowed),
        String(Boolean(invite.sentAt)),
        String(invite.rsvpStatus.hasResponded),
        String(invite.rsvpStatus.isAttending ?? ''),
        String(invite.rsvpStatus.adultsAttending ?? ''),
        String(invite.rsvpStatus.childrenAttending ?? ''),
      ].map(escapeCsvValue)
    })

    const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `selected-invites-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setNotice({ variant: 'default', message: 'CSV export generated.' })
  }

  const updateGroupGuest = (
    index: number,
    field: 'name' | 'email' | 'parentGuestId',
    value: string
  ) => {
    setGroupGuests((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      return updated
    })
  }

  const addAdultGuest = () => {
    setGroupGuests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        email: '',
        isChild: false,
        isInviteLead: prev.every((guest) => !guest.isInviteLead),
      },
    ])
  }

  const addChildGuest = () => {
    const eligibleParents = groupGuests.filter((guest) => !guest.isChild && !guest.isInviteLead)
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
      const filtered = prev.filter((guest) => guest.id !== id && guest.parentGuestId !== id)
      if (!filtered.some((guest) => guest.isInviteLead)) {
        const firstAdultIndex = filtered.findIndex((guest) => !guest.isChild)
        if (firstAdultIndex >= 0) {
          filtered[firstAdultIndex] = { ...filtered[firstAdultIndex], isInviteLead: true }
        }
      }
      return filtered
    })
  }

  const toggleGuestType = (id: string, isChild: boolean) => {
    setGroupGuests((prev) => {
      const eligibleParents = prev.filter((guest) => guest.id !== id && !guest.isChild && !guest.isInviteLead)
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

  const closeConfirmDialog = () => setConfirmState(null)

  const handleConfirmAction = async () => {
    if (!confirmState) return

    if (confirmState.type === 'delete') {
      const inviteId = confirmState.inviteId
      closeConfirmDialog()
      await handleDeleteInvite(inviteId)
      return
    }

    const reminderInviteIds = confirmState.inviteIds
    closeConfirmDialog()
    await executeBulkReminderSend(reminderInviteIds)
  }

  const openDeleteConfirm = (inviteId: string, inviteLabel: string) => {
    setConfirmState({ type: 'delete', inviteId, inviteLabel })
  }

  const openBulkReminderConfirm = () => {
    if (selectedReminderEligibleIds.length === 0) {
      setNotice({
        variant: 'destructive',
        message: 'Select at least one invite that was already sent and has not RSVP\'d.',
      })
      return
    }

    setConfirmState({
      type: 'reminders',
      inviteIds: selectedReminderEligibleIds,
    })
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSentFilter('all')
    setResponseFilter('all')
    setAttendanceFilter('all')
    setInviteShapeFilter('all')
    setSortBy('newest')
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
          <Button onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? 'Cancel' : 'Create Invite'}
          </Button>
        }
      />

      {notice && (
        <Alert variant={notice.variant} className="mb-6">
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Invite</CardTitle>
            <CardDescription>Send invitations to individual guests or groups</CardDescription>
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
                  <Label htmlFor="plusOne" className="cursor-pointer font-normal">
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
                    <div key={guest.id} className="space-y-3 rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={guest.isChild ? 'secondary' : 'outline'}>
                          {guest.isChild ? 'Child' : 'Adult'}
                        </Badge>
                        {!guest.isChild && guest.isInviteLead && <Badge>Invite Lead</Badge>}
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

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={guest.parentGuestId || ''}
                            onChange={(e) => updateGroupGuest(idx, 'parentGuestId', e.target.value)}
                          >
                            <option value="">Select parent</option>
                            {groupGuests
                              .filter((parent) => !parent.isChild && !parent.isInviteLead && parent.id !== guest.id)
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
          action={<Button onClick={() => setShowForm(true)}>Create First Invite</Button>}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              All Invites ({filteredInvites.length}
              {filteredInvites.length !== invites.length ? ` of ${invites.length}` : ''})
            </CardTitle>
            <CardDescription>
              Search, filter, and sort invitations for faster admin work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sentFilter={sentFilter}
              setSentFilter={setSentFilter}
              responseFilter={responseFilter}
              setResponseFilter={setResponseFilter}
              attendanceFilter={attendanceFilter}
              setAttendanceFilter={setAttendanceFilter}
              inviteShapeFilter={inviteShapeFilter}
              setInviteShapeFilter={setInviteShapeFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onReset={resetFilters}
            />

            <BulkActions
              filteredInvites={filteredInvites}
              selectedInviteIds={selectedInviteIds}
              reminderEligibleCount={selectedReminderEligibleIds.length}
              selectedFilteredCount={selectedFilteredCount}
              onToggleSelectAllFiltered={toggleSelectAllFiltered}
              onSendReminders={openBulkReminderConfirm}
              onExportCsv={handleExportSelectedCsv}
              bulkSending={bulkSending}
            />

            <InvitesTable
              filteredInvites={filteredInvites}
              selectedInviteIds={selectedInviteIds}
              sending={sending}
              onToggleSelectAllFiltered={toggleSelectAllFiltered}
              onToggleInviteSelection={toggleInviteSelection}
              onSendEmail={handleSendEmail}
              onDelete={openDeleteConfirm}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmState !== null} onOpenChange={(open) => (!open ? closeConfirmDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmState?.type === 'delete' ? 'Delete Invite?' : 'Send Reminder Emails?'}
            </DialogTitle>
            <DialogDescription>
              {confirmState?.type === 'delete'
                ? `This will permanently delete ${confirmState.inviteLabel}.`
                : `This will send reminder emails to ${confirmState?.type === 'reminders' ? confirmState.inviteIds.length : 0} invite(s) that were sent and have not RSVP'd.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeConfirmDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmState?.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
            >
              {confirmState?.type === 'delete' ? 'Delete Invite' : 'Send Reminders'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
