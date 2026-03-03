export type GuestTypeLabel = 'Adult' | 'Child' | 'Plus One'

export interface GuestTypeInput {
  isChild: boolean
  isPlusOne: boolean
}

export interface TableRecord {
  id: string
  name: string
  tableNumber: number
  capacity: number
}

export interface TableAssignmentRecord {
  tableId: string
}

export interface TableSeatingSummary {
  id: string
  name: string
  tableNumber: number
  capacity: number
  assignedSeats: number
  availableSeats: number
  isFull: boolean
}

export interface CapacityCheckInput {
  targetTableId: string
  currentTableId?: string | null
  assignedSeats: number
  capacity: number
}

export const getGuestTypeLabel = ({ isChild, isPlusOne }: GuestTypeInput): GuestTypeLabel => {
  if (isChild) return 'Child'
  if (isPlusOne) return 'Plus One'
  return 'Adult'
}

export const buildTableSeatingSummary = (
  tables: TableRecord[],
  assignments: TableAssignmentRecord[]
): TableSeatingSummary[] => {
  const assignedSeatCounts = new Map<string, number>()

  for (const assignment of assignments) {
    assignedSeatCounts.set(
      assignment.tableId,
      (assignedSeatCounts.get(assignment.tableId) ?? 0) + 1
    )
  }

  return tables
    .map((table) => {
      const assignedSeats = assignedSeatCounts.get(table.id) ?? 0
      return {
        id: table.id,
        name: table.name,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        assignedSeats,
        availableSeats: Math.max(table.capacity - assignedSeats, 0),
        isFull: assignedSeats >= table.capacity,
      }
    })
    .sort((a, b) => a.tableNumber - b.tableNumber)
}

export const canAssignSeatToTable = ({
  targetTableId,
  currentTableId,
  assignedSeats,
  capacity,
}: CapacityCheckInput): boolean => {
  if (currentTableId === targetTableId) {
    return true
  }

  return assignedSeats < capacity
}
