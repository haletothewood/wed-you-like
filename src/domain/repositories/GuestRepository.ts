export interface GuestData {
  id: string
  name: string
  email: string
  inviteId: string
  isPlusOne: boolean
  isChild: boolean
  parentGuestId?: string
  isInviteLead: boolean
}

export interface GuestRepository {
  save(guest: GuestData): Promise<GuestData>
  findById(id: string): Promise<GuestData | null>
  findByInviteId(inviteId: string): Promise<GuestData[]>
  findPlusOneByInviteId(inviteId: string): Promise<GuestData | null>
  delete(id: string): Promise<void>
}
