import { describe, expect, it } from 'vitest'
import { planThankYouCampaign, type ThankYouCampaignInvite } from '@/application/campaigns/planThankYouCampaign'

const makeInvite = (overrides: Partial<ThankYouCampaignInvite>): ThankYouCampaignInvite => ({
  id: 'invite-1',
  token: 'token-1',
  groupName: null,
  sentAt: new Date('2026-01-01T10:00:00Z'),
  thankYouSentAt: null,
  guests: [{ name: 'Guest One', email: 'guest@example.com' }],
  ...overrides,
})

describe('planThankYouCampaign', () => {
  it('includes invites that were sent, are attending, and have not been thanked', () => {
    const plan = planThankYouCampaign({
      invites: [makeInvite({ id: 'invite-a', token: 'token-a' })],
      attendingInviteIds: new Set(['invite-a']),
    })

    expect(plan.recipients).toHaveLength(1)
    expect(plan.recipients[0]).toMatchObject({
      inviteId: 'invite-a',
      token: 'token-a',
      email: 'guest@example.com',
    })
    expect(plan.skippedAlreadyThanked).toBe(0)
  })

  it('skips invites that have already received a thank-you email', () => {
    const plan = planThankYouCampaign({
      invites: [
        makeInvite({
          id: 'invite-b',
          thankYouSentAt: new Date('2026-02-01T12:00:00Z'),
        }),
      ],
      attendingInviteIds: new Set(['invite-b']),
    })

    expect(plan.recipients).toHaveLength(0)
    expect(plan.skippedAlreadyThanked).toBe(1)
  })

  it('tracks skip reasons for not-sent, not-attending, and missing-email invites', () => {
    const plan = planThankYouCampaign({
      invites: [
        makeInvite({ id: 'not-sent', sentAt: null }),
        makeInvite({ id: 'not-attending' }),
        makeInvite({
          id: 'missing-email',
          guests: [{ name: 'No Email', email: '' }],
        }),
      ],
      attendingInviteIds: new Set(['missing-email']),
    })

    expect(plan.recipients).toHaveLength(0)
    expect(plan.skippedNotSent).toBe(1)
    expect(plan.skippedNotAttending).toBe(1)
    expect(plan.skippedNoEmail).toBe(1)
  })
})
