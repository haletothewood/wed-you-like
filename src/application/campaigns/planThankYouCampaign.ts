export interface ThankYouCampaignGuest {
  name: string
  email: string
}

export interface ThankYouCampaignInvite {
  id: string
  token: string
  groupName: string | null
  sentAt: Date | null
  thankYouSentAt: Date | null
  guests: ThankYouCampaignGuest[]
}

export interface ThankYouCampaignRecipient {
  inviteId: string
  token: string
  groupName: string | null
  guestName: string
  email: string
}

export interface ThankYouCampaignPlan {
  recipients: ThankYouCampaignRecipient[]
  skippedNotSent: number
  skippedNotAttending: number
  skippedAlreadyThanked: number
  skippedNoEmail: number
}

interface PlanThankYouCampaignInput {
  invites: ThankYouCampaignInvite[]
  attendingInviteIds: Set<string>
}

export const planThankYouCampaign = ({
  invites,
  attendingInviteIds,
}: PlanThankYouCampaignInput): ThankYouCampaignPlan => {
  const recipients: ThankYouCampaignRecipient[] = []
  let skippedNotSent = 0
  let skippedNotAttending = 0
  let skippedAlreadyThanked = 0
  let skippedNoEmail = 0

  for (const invite of invites) {
    if (!invite.sentAt) {
      skippedNotSent++
      continue
    }

    if (!attendingInviteIds.has(invite.id)) {
      skippedNotAttending++
      continue
    }

    if (invite.thankYouSentAt) {
      skippedAlreadyThanked++
      continue
    }

    const primaryGuest = invite.guests.find((guest) => guest.email && guest.email.trim() !== '')
    if (!primaryGuest) {
      skippedNoEmail++
      continue
    }

    recipients.push({
      inviteId: invite.id,
      token: invite.token,
      groupName: invite.groupName,
      guestName: primaryGuest.name,
      email: primaryGuest.email,
    })
  }

  return {
    recipients,
    skippedNotSent,
    skippedNotAttending,
    skippedAlreadyThanked,
    skippedNoEmail,
  }
}
