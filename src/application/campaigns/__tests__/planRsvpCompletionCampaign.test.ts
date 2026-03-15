import { describe, expect, it } from 'vitest'
import {
  planRsvpCompletionCampaign,
  type RsvpCompletionCampaignInvite,
} from '@/application/campaigns/planRsvpCompletionCampaign'

const makeInvite = (
  overrides: Partial<RsvpCompletionCampaignInvite>
): RsvpCompletionCampaignInvite => ({
  id: 'invite-1',
  token: 'token-1',
  groupName: null,
  sentAt: '2026-01-01T10:00:00.000Z',
  guests: [{ name: 'Guest One', email: 'guest@example.com' }],
  rsvpStatus: {
    hasResponded: true,
    isAttending: true,
  },
  completeness: {
    isComplete: false,
  },
  ...overrides,
})

describe('planRsvpCompletionCampaign', () => {
  it('includes sent, attending, incomplete invites with an email address', () => {
    const plan = planRsvpCompletionCampaign({
      invites: [makeInvite({ id: 'invite-a', token: 'token-a' })],
    })

    expect(plan.recipients).toHaveLength(1)
    expect(plan.recipients[0]).toMatchObject({
      inviteId: 'invite-a',
      token: 'token-a',
      email: 'guest@example.com',
    })
  })

  it('skips invites that are still pending, not attending, or already complete', () => {
    const plan = planRsvpCompletionCampaign({
      invites: [
        makeInvite({
          id: 'pending',
          rsvpStatus: { hasResponded: false, isAttending: null },
        }),
        makeInvite({
          id: 'not-attending',
          rsvpStatus: { hasResponded: true, isAttending: false },
        }),
        makeInvite({
          id: 'complete',
          completeness: { isComplete: true },
        }),
      ],
    })

    expect(plan.recipients).toHaveLength(0)
    expect(plan.skippedPending).toBe(1)
    expect(plan.skippedNotAttending).toBe(1)
    expect(plan.skippedComplete).toBe(1)
  })

  it('tracks missing-contact and not-sent skips separately', () => {
    const plan = planRsvpCompletionCampaign({
      invites: [
        makeInvite({ id: 'not-sent', sentAt: null }),
        makeInvite({
          id: 'missing-email',
          guests: [{ name: 'No Email', email: '' }],
        }),
      ],
    })

    expect(plan.recipients).toHaveLength(0)
    expect(plan.skippedNotSent).toBe(1)
    expect(plan.skippedNoEmail).toBe(1)
  })
})
