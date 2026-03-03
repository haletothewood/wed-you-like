'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface SeatingTable {
  id: string
  tableNumber: number
  capacity: number
  assignedSeats: number
  availableSeats: number
  isFull: boolean
}

interface SeatingGuest {
  id: string
  name: string
  inviteGroupName: string | null
  guestType: 'Adult' | 'Child' | 'Plus One'
  tableId: string | null
}

interface SeatingResponse {
  tables: SeatingTable[]
  guests: SeatingGuest[]
}

export default function TablesAdminPage() {
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [guests, setGuests] = useState<SeatingGuest[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [capacity, setCapacity] = useState('')
  const [creatingTable, setCreatingTable] = useState(false)
  const [updatingGuestId, setUpdatingGuestId] = useState<string | null>(null)
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null)

  useEffect(() => {
    fetchSeatingData()
  }, [])

  const fetchSeatingData = async () => {
    try {
      const response = await fetch('/api/admin/table-assignments')
      const data = (await response.json()) as SeatingResponse
      setTables(data.tables || [])
      setGuests(data.guests || [])
    } catch (error) {
      console.error('Error fetching seating data:', error)
      setTables([])
      setGuests([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTable = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreatingTable(true)

    try {
      const response = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: Number(tableNumber),
          capacity: Number(capacity),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create table')
      }

      setTableNumber('')
      setCapacity('')
      await fetchSeatingData()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create table')
    } finally {
      setCreatingTable(false)
    }
  }

  const handleDeleteTable = async (tableId: string, tableNo: number) => {
    if (!confirm(`Delete Table ${tableNo}? This will remove its assignments.`)) {
      return
    }

    setDeletingTableId(tableId)
    try {
      const response = await fetch(`/api/admin/tables/${tableId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete table')
      }
      await fetchSeatingData()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete table')
    } finally {
      setDeletingTableId(null)
    }
  }

  const handleAssignGuest = async (guestId: string, selectedTableId: string) => {
    setUpdatingGuestId(guestId)
    try {
      const tableId = selectedTableId === 'unassigned' ? null : selectedTableId
      const response = await fetch('/api/admin/table-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, tableId }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update assignment')
      }
      await fetchSeatingData()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update assignment')
    } finally {
      setUpdatingGuestId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading table assignments..." />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Table Assignments"
        description="Assign attending guests to tables. Children and plus-ones are marked explicitly and count as seats."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Table</CardTitle>
          <CardDescription>Add a table number and seat capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-3" onSubmit={handleCreateTable}>
            <div className="space-y-1">
              <Label htmlFor="table-number">Table Number</Label>
              <Input
                id="table-number"
                type="number"
                min={1}
                step={1}
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="table-capacity">Capacity</Label>
              <Input
                id="table-capacity"
                type="number"
                min={1}
                step={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" type="submit" disabled={creatingTable}>
                {creatingTable ? 'Creating...' : 'Add Table'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Table Capacity</CardTitle>
          <CardDescription>Current table occupancy</CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">No tables created yet</div>
          ) : (
            <div className="space-y-2">
              {tables.map((table) => (
                <div key={table.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Table {table.tableNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {table.assignedSeats}/{table.capacity} seats assigned
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={table.isFull ? 'destructive' : 'outline'}>
                      {table.isFull ? 'Full' : `${table.availableSeats} open`}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                      disabled={deletingTableId === table.id}
                    >
                      {deletingTableId === table.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest Seating</CardTitle>
          <CardDescription>Assign each attending guest to a table</CardDescription>
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No attending guests available for seating
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invite Group</TableHead>
                  <TableHead>Table</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>
                      <Badge variant={guest.guestType === 'Child' ? 'secondary' : 'outline'}>
                        {guest.guestType}
                      </Badge>
                    </TableCell>
                    <TableCell>{guest.inviteGroupName || 'Individual Invite'}</TableCell>
                    <TableCell>
                      <Select
                        value={guest.tableId ?? 'unassigned'}
                        onValueChange={(nextValue) => handleAssignGuest(guest.id, nextValue)}
                        disabled={updatingGuestId === guest.id}
                      >
                        <SelectTrigger className="w-full min-w-[180px]">
                          <SelectValue placeholder="Select table" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {tables.map((table) => (
                            <SelectItem key={table.id} value={table.id}>
                              Table {table.tableNumber} ({table.assignedSeats}/{table.capacity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
