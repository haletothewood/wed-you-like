export interface GuestData {
  id: string
  name: string
  email: string
  inviteId: string
  isPlusOne: boolean
}

export interface GuestRepository {
  save(guest: GuestData): Promise<GuestData>
  findById(id: string): Promise<GuestData | null>
  findByInviteId(inviteId: string): Promise<GuestData[]>
  findPlusOneByInviteId(inviteId: string): Promise<GuestData | null>
  delete(id: string): Promise<void>
}
