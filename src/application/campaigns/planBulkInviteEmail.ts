import { findGuestWithEmail } from '@/application/invites/contactDetails'

export type BulkEmailMode = 'invite' | 'reminder'

export type BulkEmailSkipReason =
  | 'invite_not_found'
  | 'no_email'
  | 'already_sent'
  | 'not_sent'
  | 'already_responded'

export interface BulkEmailInviteGuest {
  name: string
  email: string
}

export interface BulkEmailInviteRecord {
  id: string
  groupName: string | null
  sentAt: Date | null
  guests: BulkEmailInviteGuest[]
}

export interface BulkEmailPlanResult {
  inviteId: string
  mode: BulkEmailMode
  status: 'would_send' | 'skipped'
  reason?: BulkEmailSkipReason
  label: string
  email?: string
}

export interface BulkEmailPlan {
  mode: BulkEmailMode
  requested: number
  eligible: number
  skipped: number
  results: BulkEmailPlanResult[]
}

interface PlanBulkInviteEmailInput {
  mode: BulkEmailMode
  inviteIds: string[]
  invitesById: Map<string, BulkEmailInviteRecord>
  respondedInviteIds: Set<string>
}

export const planBulkInviteEmail = ({
  mode,
  inviteIds,
  invitesById,
  respondedInviteIds,
}: PlanBulkInviteEmailInput): BulkEmailPlan => {
  const uniqueInviteIds = Array.from(new Set(inviteIds))
  const results: BulkEmailPlanResult[] = []
  let eligible = 0
  let skipped = 0

  for (const inviteId of uniqueInviteIds) {
    const invite = invitesById.get(inviteId)

    if (!invite) {
      skipped++
      results.push({
        inviteId,
        mode,
        status: 'skipped',
        reason: 'invite_not_found',
        label: inviteId,
      })
      continue
    }

    const label = invite.groupName || invite.guests[0]?.name || invite.id
    const primaryGuest = findGuestWithEmail(invite.guests)

    if (!primaryGuest) {
      skipped++
      results.push({
        inviteId,
        mode,
        status: 'skipped',
        reason: 'no_email',
        label,
      })
      continue
    }

    if (mode === 'invite') {
      if (invite.sentAt) {
        skipped++
        results.push({
          inviteId,
          mode,
          status: 'skipped',
          reason: 'already_sent',
          label,
          email: primaryGuest.email,
        })
        continue
      }
    } else {
      if (!invite.sentAt) {
        skipped++
        results.push({
          inviteId,
          mode,
          status: 'skipped',
          reason: 'not_sent',
          label,
          email: primaryGuest.email,
        })
        continue
      }

      if (respondedInviteIds.has(inviteId)) {
        skipped++
        results.push({
          inviteId,
          mode,
          status: 'skipped',
          reason: 'already_responded',
          label,
          email: primaryGuest.email,
        })
        continue
      }
    }

    eligible++
    results.push({
      inviteId,
      mode,
      status: 'would_send',
      label,
      email: primaryGuest.email,
    })
  }

  return {
    mode,
    requested: uniqueInviteIds.length,
    eligible,
    skipped,
    results,
  }
}
