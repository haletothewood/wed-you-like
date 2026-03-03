import { describe, expect, it } from 'vitest'
import { planBulkInviteEmail, type BulkEmailInviteRecord } from '@/application/campaigns/planBulkInviteEmail'

const makeInvite = (overrides: Partial<BulkEmailInviteRecord>): BulkEmailInviteRecord => ({
  id: 'invite-1',
  groupName: null,
  sentAt: null,
  guests: [{ name: 'Guest', email: 'guest@example.com' }],
  ...overrides,
})

describe('planBulkInviteEmail', () => {
  it('marks unsent invites as eligible for invite mode', () => {
    const invite = makeInvite({ id: 'invite-a', sentAt: null })
    const plan = planBulkInviteEmail({
      mode: 'invite',
      inviteIds: ['invite-a'],
      invitesById: new Map([[invite.id, invite]]),
      respondedInviteIds: new Set(),
    })

    expect(plan.eligible).toBe(1)
    expect(plan.skipped).toBe(0)
    expect(plan.results[0].status).toBe('would_send')
  })

  it('skips already sent invites in invite mode', () => {
    const invite = makeInvite({ id: 'invite-b', sentAt: new Date('2026-01-01T00:00:00Z') })
    const plan = planBulkInviteEmail({
      mode: 'invite',
      inviteIds: ['invite-b'],
      invitesById: new Map([[invite.id, invite]]),
      respondedInviteIds: new Set(),
    })

    expect(plan.eligible).toBe(0)
    expect(plan.skipped).toBe(1)
    expect(plan.results[0]).toMatchObject({
      status: 'skipped',
      reason: 'already_sent',
    })
  })

  it('skips not-sent and already-responded invites in reminder mode', () => {
    const notSent = makeInvite({ id: 'invite-c', sentAt: null })
    const responded = makeInvite({ id: 'invite-d', sentAt: new Date('2026-01-01T00:00:00Z') })

    const plan = planBulkInviteEmail({
      mode: 'reminder',
      inviteIds: ['invite-c', 'invite-d'],
      invitesById: new Map([
        [notSent.id, notSent],
        [responded.id, responded],
      ]),
      respondedInviteIds: new Set(['invite-d']),
    })

    expect(plan.eligible).toBe(0)
    expect(plan.skipped).toBe(2)
    expect(plan.results.find((result) => result.inviteId === 'invite-c')?.reason).toBe('not_sent')
    expect(plan.results.find((result) => result.inviteId === 'invite-d')?.reason).toBe(
      'already_responded'
    )
  })

  it('deduplicates invite ids and marks missing/no-email targets', () => {
    const withNoEmail = makeInvite({
      id: 'invite-e',
      guests: [{ name: 'No Email', email: '' }],
    })

    const plan = planBulkInviteEmail({
      mode: 'invite',
      inviteIds: ['missing-id', 'invite-e', 'invite-e'],
      invitesById: new Map([[withNoEmail.id, withNoEmail]]),
      respondedInviteIds: new Set(),
    })

    expect(plan.requested).toBe(2)
    expect(plan.eligible).toBe(0)
    expect(plan.skipped).toBe(2)
    expect(plan.results.find((result) => result.inviteId === 'missing-id')?.reason).toBe(
      'invite_not_found'
    )
    expect(plan.results.find((result) => result.inviteId === 'invite-e')?.reason).toBe('no_email')
  })
})
