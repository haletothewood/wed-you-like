export interface GuestContact {
  name: string
  email: string
  phone: string
}

export interface InviteContactRecord {
  id?: string
  groupName: string | null
  guests: GuestContact[]
}

export const hasEmailAddress = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim() !== ''

export const hasPhoneNumber = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim() !== ''

export const findGuestWithEmail = <T extends { email: string }>(guests: T[]): T | undefined =>
  guests.find((guest) => hasEmailAddress(guest.email))

export const findGuestWithPhone = <T extends { phone: string }>(guests: T[]): T | undefined =>
  guests.find((guest) => hasPhoneNumber(guest.phone))

export const getInviteLabel = (invite: InviteContactRecord): string =>
  invite.groupName || invite.guests[0]?.name || invite.id || 'Invite'

export const normalizePhoneForWhatsApp = (value: string): string | null => {
  const normalized = value.replace(/[^\d]/g, '')
  if (normalized.length < 8 || normalized.length > 15) {
    return null
  }
  return normalized
}

export const buildWhatsAppShareUrl = (phone: string, text: string): string => {
  const url = new URL(`https://wa.me/${phone}`)
  url.searchParams.set('text', text)
  return url.toString()
}
